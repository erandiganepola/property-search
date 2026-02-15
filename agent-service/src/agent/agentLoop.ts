import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";
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

const MODEL = process.env.MODEL || "anthropic/claude-sonnet-4.5";
const MAX_TOKENS = 4096;
const MAX_TOOL_ROUNDS = 10;

export interface SSEEvent {
  type: "text" | "tool_call" | "tool_result" | "properties" | "done" | "error";
  content?: string;
  name?: string;
  conversationId?: string;
}

interface AccumulatedToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

/**
 * Run the agentic chat loop with streaming.
 * Calls the LLM via OpenRouter, executes MCP tools, and streams SSE events back.
 */
export async function runAgentLoop(
  userMessage: string,
  conversationId: string,
  mcpManager: McpManager,
  sendEvent: (event: SSEEvent) => void
): Promise<void> {
  const apimToken = await getApimToken();
  const openai = new OpenAI({
    baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
    apiKey: apimToken,
  });

  const tools = mcpManager.getTools();

  // Add user message to history
  appendMessage(conversationId, { role: "user", content: userMessage });

  const messages = getMessages(conversationId);
  console.log(
    `[Agent] Starting — conversationId: ${conversationId}, historyLength: ${messages.length}`
  );

  let toolRounds = 0;

  while (toolRounds < MAX_TOOL_ROUNDS) {
    console.log(`[Agent] Streaming response — round: ${toolRounds + 1}`);

    // Stream a response from the LLM
    const stream = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      tools: tools.length > 0 ? tools : undefined,
    });

    // Accumulate the complete response from stream chunks
    let contentAccum = "";
    const toolCallsAccum: AccumulatedToolCall[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      // Text content
      if (delta.content) {
        contentAccum += delta.content;
        sendEvent({ type: "text", content: delta.content });
      }

      // Tool call deltas — id, name, and arguments arrive incrementally
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? toolCallsAccum.length;
          if (!toolCallsAccum[idx]) {
            toolCallsAccum[idx] = {
              id: "",
              type: "function",
              function: { name: "", arguments: "" },
            };
          }
          const accum = toolCallsAccum[idx];
          if (tc.id) accum.id = tc.id;
          if (tc.function?.name) accum.function.name += tc.function.name;
          if (tc.function?.arguments)
            accum.function.arguments += tc.function.arguments;
        }
      }
    }

    // Filter out any empty slots
    const toolCalls = toolCallsAccum.filter((tc) => tc.id);

    // If no tool calls, we're done — append the final message and break
    if (toolCalls.length === 0) {
      appendMessage(conversationId, {
        role: "assistant",
        content: contentAccum,
      });
      break;
    }

    // Append assistant message with tool calls to history
    appendMessage(conversationId, {
      role: "assistant",
      content: contentAccum || null,
      tool_calls: toolCalls,
    });

    // Execute each tool call
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      console.log(`[Agent] Tool call — ${toolName}`);
      sendEvent({ type: "tool_call", name: toolName });

      const startTime = performance.now();
      try {
        const args = JSON.parse(toolCall.function.arguments);
        const resultText = await mcpManager.callTool(toolName, args);

        const duration = Math.round(performance.now() - startTime);
        console.log(
          `[Agent] Tool result — ${toolName}, ${duration}ms, success: true`
        );

        // Append tool result to history
        appendMessage(conversationId, {
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultText,
        });

        sendEvent({ type: "tool_result", name: toolName });

        // Emit property data if the result contains properties
        emitPropertyData(resultText, sendEvent);
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        const errorMsg =
          err instanceof Error ? err.message : "Tool call failed";
        console.log(
          `[Agent] Tool result — ${toolName}, ${duration}ms, success: false`
        );

        appendMessage(conversationId, {
          role: "tool",
          tool_call_id: toolCall.id,
          content: `Error: ${errorMsg}`,
        });

        sendEvent({ type: "tool_result", name: toolName });
      }
    }

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
