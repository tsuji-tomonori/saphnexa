import { useQuery } from "@tanstack/react-query";
import { apiGetOperation, apiRoutes } from "@saphnexa/api-client";
import type { ChatMessage } from "../types";

export function useChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["chat-messages", chatId],
    enabled: Boolean(chatId),
    queryFn: async () => {
      const response = await apiGetOperation("listMessages", apiRoutes.listMessages(chatId ?? ""));
      return { messages: response.messages satisfies ChatMessage[] };
    }
  });
}
