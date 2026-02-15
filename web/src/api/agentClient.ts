const AGENT_SERVICE_URL =
  import.meta.env.VITE_AGENT_SERVICE_URL || "http://localhost:3002";

export interface SSEEvent {
  type: "text" | "tool_call" | "tool_result" | "properties" | "done" | "error";
  content?: string;
  name?: string;
  conversationId?: string;
}

/**
 * Stream a chat message to the agent service and receive SSE events.
 * Returns an AbortController so the caller can cancel the request.
 */
export function streamChat(
  token: string,
  message: string,
  conversationId: string | null,
  onEvent: (event: SSEEvent) => void,
  onError: (error: string) => void
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          ...(conversationId ? { conversationId } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        onError(`Server error ${response.status}: ${text}`);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop()!; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent;
              onEvent(event);
            } catch {
              // Incomplete JSON, skip
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError(err instanceof Error ? err.message : "Connection failed");
      }
    }
  })();

  return controller;
}
