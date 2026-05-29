import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDeleteOperation, apiGetOperation, apiPatchOperation, apiPostOperation, apiRoutes } from "@saphnexa/api-client";
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

export function useAddChatParticipant(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chat_id: string; user_id: string }) =>
      apiPostOperation("addChatParticipant", apiRoutes.addChatParticipant(input.chat_id), { user_id: input.user_id }, csrfToken),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ["chat-participants", input.chat_id] });
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    }
  });
}

export function useUpdateChatParticipant(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chat_id: string; user_id: string; participant_role?: "owner" | "viewer" }) =>
      apiPatchOperation("updateChatParticipant", apiRoutes.updateChatParticipant(input.chat_id, input.user_id), { participant_role: input.participant_role ?? "viewer" }, csrfToken),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ["chat-participants", input.chat_id] });
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    }
  });
}

export function useRemoveChatParticipant(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chat_id: string; user_id: string }) =>
      apiDeleteOperation("removeChatParticipant", apiRoutes.removeChatParticipant(input.chat_id, input.user_id), csrfToken),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ["chat-participants", input.chat_id] });
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    }
  });
}
