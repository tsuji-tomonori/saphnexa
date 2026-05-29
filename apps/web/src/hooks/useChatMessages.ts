import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetOperation, apiPostOperation, apiRoutes } from "@saphnexa/api-client";
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

export function useCancelAnswerGeneration(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chat_id: string; message_id: string; reason?: string }) =>
      apiPostOperation("cancelAnswerGeneration", apiRoutes.cancelAnswerGeneration(input.chat_id, input.message_id), { reason: input.reason }, csrfToken),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ["chat-messages", input.chat_id] });
      await queryClient.invalidateQueries({ queryKey: ["message-events", input.chat_id, input.message_id] });
    }
  });
}
