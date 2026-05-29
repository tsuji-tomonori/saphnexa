import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@saphnexa/api-client";
import type { EventRow } from "../types";

export function useMessageEvents(chatId: string | null, messageId: string | null) {
  return useQuery({
    queryKey: ["message-events", chatId, messageId],
    enabled: Boolean(chatId && messageId),
    queryFn: () => apiGet<{ events: EventRow[] }>("/api/chat-sessions/" + chatId + "/messages/" + messageId + "/events")
  });
}
