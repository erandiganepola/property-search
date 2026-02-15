import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";

const conversations = new Map<string, ChatCompletionMessageParam[]>();

export function getMessages(
  conversationId: string
): ChatCompletionMessageParam[] {
  let messages = conversations.get(conversationId);
  if (!messages) {
    messages = [];
    conversations.set(conversationId, messages);
  }
  return messages;
}

export function appendMessage(
  conversationId: string,
  message: ChatCompletionMessageParam
): void {
  const messages = getMessages(conversationId);
  messages.push(message);
}
