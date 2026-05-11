import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ToolUseBlock,
  ContentBlockParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages.js";
import type { McpManager } from "../mcp/mcpManager.js";
import { getApimToken } from "../mcp/apimToken.js";
import { getMessages, appendMessage } from "./conversationStore.js";

const SYSTEM_PROMPT = `You are a US property search assistant. You help users find properties for rent and sale across the United States.

Use the available tools to search properties, compare listings, calculate mortgages, get neighborhood info, provide personalized recommendations, and get property insurance quotes.

Present results in a clear, readable format using markdown. When showing properties, include key details like price, location, bedrooms, bathrooms, and square footage.

Formatting rules:
- When comparing properties or options, ALWAYS use a markdown table. Rows = attributes (price, beds, baths, sqft), columns = properties.
- Use headings (## and ###) to separate major sections.
- Use bullet points for lists, not inline comma-separated text.
- Keep paragraphs short (2-3 sentences) for easy scanning.
- For mortgage or payment breakdowns, use a table.`;

const MODEL = process.env.MODEL || "claude-opus-4-7";
const MAX_TOKENS = 4096;
const MAX_TOOL_ROUNDS = 10;

export interface SSEEvent {
  type: "text" | "tool_call" | "tool_result" | "properties" | "done" | "error";
  content?: string;
  name?: string;
  conversationId?: string;
}

/**
 * Run the agentic chat loop with streaming.
 * Calls the LLM via the configured Anthropic-compatible endpoint, executes
 * MCP tools, and streams SSE events back.
 */
export async function runAgentLoop(
  userMessage: string,
  conversationId: string,
  mcpManager: McpManager,
  sendEvent: (event: SSEEvent) => void
): Promise<void> {
  // Prefer LLM_API_KEY when set (e.g. a real Anthropic key, used to talk
  // directly to the upstream provider). Fall back to the APIM/Bijira
  // client-credentials token used for the gateway-proxied path.
  const apiKey = process.env.LLM_API_KEY || (await getApimToken());
  const anthropic = new Anthropic({
    baseURL: process.env.LLM_BASE_URL || "https://api.anthropic.com",
    apiKey,
  });

  const tools = mcpManager.getTools();

  // Add user message to history
  appendMessage(conversationId, { role: "user", content: userMessage });

  console.log(
    `[Agent] Starting — conversationId: ${conversationId}, historyLength: ${getMessages(conversationId).length}`
  );

  let toolRounds = 0;

  while (toolRounds < MAX_TOOL_ROUNDS) {
    console.log(`[Agent] Streaming response — round: ${toolRounds + 1}`);

    const messages = getMessages(conversationId);

    // Stream a response from the LLM
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    });

    // Stream text deltas to the client as they arrive
    stream.on("text", (text) => {
      sendEvent({ type: "text", content: text });
    });

    // Wait for the full message and inspect its content blocks
    const finalMessage = await stream.finalMessage();

    // Persist the assistant turn (text + any tool_use blocks) verbatim so
    // the next round can include it in history.
    appendMessage(conversationId, {
      role: "assistant",
      content: finalMessage.content,
    });

    const toolUses = finalMessage.content.filter(
      (b): b is ToolUseBlock => b.type === "tool_use"
    );

    // No tool calls -> the assistant is done.
    if (toolUses.length === 0) {
      break;
    }

    // Execute each tool call, collect results to send back as a single
    // user message with tool_result content blocks.
    const toolResults: ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      const toolName = toolUse.name;
      console.log(`[Agent] Tool call — ${toolName}`);
      sendEvent({ type: "tool_call", name: toolName });

      const startTime = performance.now();
      try {
        const resultText = await mcpManager.callTool(
          toolName,
          toolUse.input as Record<string, unknown>
        );

        const duration = Math.round(performance.now() - startTime);
        console.log(
          `[Agent] Tool result — ${toolName}, ${duration}ms, success: true`
        );

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: resultText,
        });

        sendEvent({ type: "tool_result", name: toolName });
        emitPropertyData(resultText, sendEvent);
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        const errorMsg =
          err instanceof Error ? err.message : "Tool call failed";
        console.log(
          `[Agent] Tool result — ${toolName}, ${duration}ms, success: false`
        );

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: `Error: ${errorMsg}`,
          is_error: true,
        });

        sendEvent({ type: "tool_result", name: toolName });
      }
    }

    // Append the tool results as a single user message so the next round
    // sees them in history.
    appendMessage(conversationId, {
      role: "user",
      content: toolResults as ContentBlockParam[],
    });

    toolRounds++;
  }

  console.log(
    `[Agent] Complete — conversationId: ${conversationId}, rounds: ${toolRounds}`
  );
  sendEvent({ type: "done", conversationId });
}

/**
 * Try to extract property data from a tool result and emit it as a "properties" SSE event.
 */
function emitPropertyData(
  resultText: string,
  sendEvent: (event: SSEEvent) => void
): void {
  try {
    const parsed = JSON.parse(resultText);

    let properties: unknown[] | null = null;

    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].image) {
      // Direct array of properties (e.g. search_properties)
      properties = parsed;
    } else if (
      parsed.properties &&
      Array.isArray(parsed.properties) &&
      parsed.properties.length > 0 &&
      parsed.properties[0].image
    ) {
      // Wrapped in { properties: [...] } (e.g. compare_properties)
      properties = parsed.properties;
    }

    if (properties) {
      sendEvent({ type: "properties", content: JSON.stringify(properties) });
    }
  } catch {
    // Not JSON or no property data — that's fine, skip
  }
}
