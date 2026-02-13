import { useState, useRef, useEffect, useCallback } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { streamChat } from "../api/agentClient";
import type { SSEEvent } from "../api/agentClient";
import ChatMessage from "./ChatMessage";
import type { ChatMessageData } from "./ChatMessage";
import ChatInput from "./ChatInput";

let messageIdCounter = 0;
function nextId(): string {
  return `msg-${++messageIdCounter}`;
}

export default function ChatView() {
  const { getAccessToken } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (text: string) => {
      // Add user message
      const userMsg: ChatMessageData = {
        id: nextId(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Create placeholder for assistant response
      const assistantId = nextId();
      const assistantMsg: ChatMessageData = {
        id: assistantId,
        role: "assistant",
        content: "",
        toolCalls: [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreaming(true);

      try {
        const token = await getAccessToken();

        const controller = streamChat(
          token,
          text,
          conversationId,
          (event: SSEEvent) => {
            switch (event.type) {
              case "text":
                // Append text to the current assistant message
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + (event.content || "") }
                      : m
                  )
                );
                break;

              case "tool_call":
                // Add tool call indicator
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          toolCalls: [
                            ...(m.toolCalls || []),
                            event.name || "unknown",
                          ],
                        }
                      : m
                  )
                );
                break;

              case "done":
                if (event.conversationId) {
                  setConversationId(event.conversationId);
                }
                setStreaming(false);
                break;

              case "error":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content:
                            m.content +
                            `\n\n**Error:** ${event.content || "Something went wrong."}`,
                        }
                      : m
                  )
                );
                setStreaming(false);
                break;
            }
          },
          (error: string) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: `**Error:** ${error}` }
                  : m
              )
            );
            setStreaming(false);
          }
        );

        abortRef.current = controller;
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "**Error:** Failed to get access token." }
              : m
          )
        );
        setStreaming(false);
      }
    },
    [getAccessToken, conversationId]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Property Search Assistant
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Ask me about properties for rent or sale across the US. I can
                search listings, compare properties, calculate mortgages, and
                share neighborhood info.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "What states have listings?",
                  "Find rentals in California",
                  "Compare properties in New York",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Streaming indicator */}
          {streaming &&
            messages.length > 0 &&
            messages[messages.length - 1].content === "" && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
