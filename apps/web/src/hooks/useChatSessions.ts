import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../../packages/api-client/src/client";
import type { Chat } from "../types";

export function useChatSessions() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => apiGet<{ chats: Chat[] }>("/api/chat-sessions")
  });
}
