import { useMutation } from "@tanstack/react-query";
import { apiPostOperation, apiRoutes } from "@saphnexa/api-client";
import type { MessageFeedback } from "../types";

export function useCreateFeedback(csrfToken: string) {
  return useMutation({
    mutationFn: async (input: { chat_id: string; message_id: string; rating: "positive" | "negative"; comment?: string | undefined; problem_type?: string | undefined }) => {
      const response = await apiPostOperation("createFeedback", apiRoutes.createFeedback(input.chat_id, input.message_id), pruneEmpty(input), csrfToken);
      return { feedback: response.feedback satisfies MessageFeedback };
    }
  });
}

function pruneEmpty(input: { rating: "positive" | "negative"; comment?: string | undefined; problem_type?: string | undefined }) {
  return {
    rating: input.rating,
    ...(input.comment ? { comment: input.comment } : {}),
    ...(input.problem_type ? { problem_type: input.problem_type } : {})
  };
}
