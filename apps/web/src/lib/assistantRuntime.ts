import type { ChatModelAdapter } from "@assistant-ui/react";
import { apiPost, apiRoutes } from "@saphnexa/api-client";

export function createSaphnexaAssistantAdapter(csrfToken: string, chatId: string): ChatModelAdapter {
  return {
    async run({ messages }) {
      const lastMessage = messages.at(-1);
      const question = lastMessage?.content?.map((part) => ("text" in part ? part.text : "")).join("") ?? "";
      const accepted = await apiPost<{ message_id: string }>(
        apiRoutes.submitQuestion(chatId),
        { question },
        csrfToken
      );
      return {
        content: [{ type: "text", text: `message_id: ${accepted.message_id}` }]
      };
    }
  };
}
