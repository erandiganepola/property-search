import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages.js";
import type { McpManager } from "../mcp/mcpManager.js";
import { getMessages, appendMessage } from "./conversationStore.js";

const SYSTEM_PROMPT = `You are a US property search assistant. You help users find properties for rent and sale across the United States.

Use the available tools to search properties, compare listings, calculate mortgages, get neighborhood info, and provide personalized recommendations.

Present results in a clear, readable format using markdown. When showing properties, include key details like price, location, bedrooms, bathrooms, and square footage.`;

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 4096;
const MAX_TOOL_ROUNDS = 10;

export interface SSEEvent {
  type: "text" | "tool_call" | "tool_result" | "done" | "error";
  content?: string;
  name?: string;
  conversationId?: string;
}

/**
 * Run the agentic chat loop with streaming.
 * Calls Anthropic, executes MCP tools, and streams SSE events back.
 */
export async function runAgentLoop(
  userMessage: string,
  conversationId: string,
  mcpManager: McpManager,
  sendEvent: (event: SSEEvent) => void
): Promise<void> {
  const anthropic = new Anthropic();
  const tools = mcpManager.getTools();

  // Add user message to history
  appendMessage(conversationId, { role: "user", content: userMessage });

  const messages = getMessages(conversationId);

  let toolRounds = 0;

  while (toolRounds < MAX_TOOL_ROUNDS) {
    // Stream a response from Claude
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    // Forward text deltas as they arrive
    stream.on("text", (text) => {
      sendEvent({ type: "text", content: text });
    });

    const response = await stream.finalMessage();

    // Append assistant message to history
    appendMessage(conversationId, {
      role: "assistant",
      content: response.content,
    });

    // If no tool use, we're done
    if (response.stop_reason !== "tool_use") {
      break;
    }

    // Process tool calls
    const toolResults: ContentBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      sendEvent({ type: "tool_call", name: block.name });

      try {
        const resultText = await mcpManager.callTool(
          block.name,
          block.input as Record<string, unknown>
        );

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: resultText,
        } as ToolResultBlockParam);

        sendEvent({ type: "tool_result", name: block.name });
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Tool call failed";

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: ${errorMsg}`,
          is_error: true,
        } as ToolResultBlockParam);

        sendEvent({ type: "tool_result", name: block.name });
      }
    }

    // Add tool results to history and continue the loop
    appendMessage(conversationId, {
      role: "user",
      content: toolResults,
    });

    toolRounds++;
  }

  sendEvent({ type: "done", conversationId });
}
