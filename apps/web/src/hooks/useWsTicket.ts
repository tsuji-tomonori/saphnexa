import { useMutation } from "@tanstack/react-query";
import { apiPostOperation, apiRoutes } from "@saphnexa/api-client";

export function useIssueWsTicket(csrfToken: string) {
  return useMutation({
    mutationFn: (input: { chat_id: string; message_id: string }) =>
      apiPostOperation("issueWsTicket", apiRoutes.issueWsTicket(), { chat_id: input.chat_id, message_id: input.message_id }, csrfToken)
  });
}
