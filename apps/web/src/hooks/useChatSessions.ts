import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDeleteOperation, apiGetOperation, apiPatchOperation, apiRoutes } from "@saphnexa/api-client";
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

export function useUpdateChatSession(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chat_id: string; title: string }) =>
      apiPatchOperation("updateChatSession", apiRoutes.updateChatSession(input.chat_id), { title: input.title }, csrfToken),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["chat-participants", input.chat_id] });
      await queryClient.invalidateQueries({ queryKey: ["chat-messages", input.chat_id] });
    }
  });
}

export function useDeleteChatSession(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chat_id: string }) =>
      apiDeleteOperation("deleteChatSession", apiRoutes.deleteChatSession(input.chat_id), csrfToken),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["chat-participants", input.chat_id] });
      await queryClient.invalidateQueries({ queryKey: ["chat-messages", input.chat_id] });
      await queryClient.invalidateQueries({ queryKey: ["chat-events", input.chat_id] });
    }
  });
}
