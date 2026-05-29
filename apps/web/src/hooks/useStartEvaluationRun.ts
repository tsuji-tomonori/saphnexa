import { useMutation } from "@tanstack/react-query";
import { apiPost, apiRoutes } from "@saphnexa/api-client";

export function useStartEvaluationRun(csrfToken: string) {
  return useMutation({
    mutationFn: (datasetId: string) =>
      apiPost<{ evaluation_run: { status: string } }>(apiRoutes.startEvaluationRun(), { dataset_id: datasetId }, csrfToken)
  });
}
