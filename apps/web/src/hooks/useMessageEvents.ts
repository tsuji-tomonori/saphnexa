import { useQuery } from "@tanstack/react-query";
import { apiGetOperation, apiRoutes } from "@saphnexa/api-client";
import type { EventRow } from "../types";

export function useMessageEvents(chatId: string | null, messageId: string | null) {
  return useQuery({
    queryKey: ["message-events", chatId, messageId],
    enabled: Boolean(chatId && messageId),
    queryFn: async () => {
      const response = await apiGetOperation("listMessageEvents", apiRoutes.listMessageEvents(chatId ?? "", messageId ?? ""));
      return { events: response.events satisfies EventRow[] };
    }
  });
}
