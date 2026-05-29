import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDeleteOperation, apiGetOperation, apiPostOperation, apiRoutes } from "@saphnexa/api-client";
import type { Favorite } from "../types";

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const response = await apiGetOperation("listFavorites", apiRoutes.listFavorites());
      return { favorites: response.favorites satisfies Favorite[] };
    }
  });
}

export function useAddFavorite(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chat_id: string; message_id?: string | undefined }) =>
      apiPostOperation("addFavorite", apiRoutes.addFavorite(), pruneEmpty(input), csrfToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
  });
}

export function useDeleteFavorite(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { favorite_id: string }) => apiDeleteOperation("deleteFavorite", apiRoutes.deleteFavorite(input.favorite_id), csrfToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
  });
}

function pruneEmpty(input: { chat_id: string; message_id?: string | undefined }) {
  return {
    chat_id: input.chat_id,
    ...(input.message_id ? { message_id: input.message_id } : {})
  };
}
