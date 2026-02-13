import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";

const conversations = new Map<string, MessageParam[]>();

export function getMessages(conversationId: string): MessageParam[] {
  let messages = conversations.get(conversationId);
  if (!messages) {
    messages = [];
    conversations.set(conversationId, messages);
  }
  return messages;
}

export function appendMessage(
  conversationId: string,
  message: MessageParam
): void {
  const messages = getMessages(conversationId);
  messages.push(message);
}
