import { useQuery } from "@tanstack/react-query";
import { apiGetOperation, apiRoutes } from "@saphnexa/api-client";
import type { Chat } from "../types";

export function useChatSessions() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const response = await apiGetOperation("listChatSessions", apiRoutes.listChatSessions());
      return { chats: response.chats satisfies Chat[] };
    }
  });
}
