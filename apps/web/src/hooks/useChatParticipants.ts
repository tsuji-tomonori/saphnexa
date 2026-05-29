import { useQuery } from "@tanstack/react-query";
import { apiGetOperation, apiRoutes } from "@saphnexa/api-client";
import type { ChatParticipant } from "../types";

export function useChatParticipants(chatId: string | null) {
  return useQuery({
    queryKey: ["chat-participants", chatId],
    enabled: Boolean(chatId),
    queryFn: async () => {
      const response = await apiGetOperation("listChatParticipants", apiRoutes.listChatParticipants(chatId ?? ""));
      return { participants: response.participants satisfies ChatParticipant[] };
    }
  });
}
