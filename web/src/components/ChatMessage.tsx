import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Loader2, CheckCircle2, Building2, ChevronRight } from "lucide-react";
import type { Property } from "../data/properties";

export interface ContentSegment {
  type: "text" | "tool_call";
  content: string; // text content or tool namespaced name
  done?: boolean; // tool_call only: true after tool_result received
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  segments?: ContentSegment[];
  properties?: Property[];
}

interface ChatMessageProps {
  message: ChatMessageData;
  onViewProperties?: (properties: Property[]) => void;
}

const PROSE_CLASSES =
  "prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0 prose-table:w-full prose-th:text-left";

export default function ChatMessage({ message, onViewProperties }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasProperties =
    message.properties && message.properties.length > 0;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "max-w-[80%] bg-indigo-600 text-white"
            : "max-w-[80%] bg-white border border-gray-200 text-gray-900 shadow-sm"
        }`}
      >
        {/* User message */}
        {isUser && (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Assistant message — render segments inline */}
        {!isUser &&
          message.segments &&
          message.segments.map((seg, i) => {
            if (seg.type === "text" && seg.content) {
              return (
                <div key={i} className={PROSE_CLASSES}>
                  <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {seg.content}
                  </Markdown>
                </div>
              );
            }
            if (seg.type === "tool_call") {
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 my-1 mr-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium"
                >
                  {seg.done ? (
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  ) : (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  {formatToolName(seg.content)}
                </span>
              );
            }
            return null;
          })}

        {/* Fallback: no segments yet, show content directly */}
        {!isUser && !message.segments?.length && message.content && (
          <div className={PROSE_CLASSES}>
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{message.content}</Markdown>
          </div>
        )}

        {/* View Properties button */}
        {!isUser && hasProperties && (
          <button
            type="button"
            onClick={() => onViewProperties?.(message.properties!)}
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            View {message.properties!.length} Properties
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function formatToolName(namespacedName: string): string {
  const toolName = namespacedName.includes("__")
    ? namespacedName.split("__")[1]
    : namespacedName;

  return toolName
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
