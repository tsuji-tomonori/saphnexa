import { useQuery } from "@tanstack/react-query";
import { apiGet, apiRoutes } from "@saphnexa/api-client";
import type { Chat } from "../types";

export function useChatSessions() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => apiGet<{ chats: Chat[] }>(apiRoutes.listChatSessions())
  });
}
