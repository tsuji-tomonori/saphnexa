import { useMutation } from "@tanstack/react-query";
import { apiPostOperation, apiRoutes } from "@saphnexa/api-client";

export function useStartEvaluationRun(csrfToken: string) {
  return useMutation({
    mutationFn: (datasetId: string) =>
      apiPostOperation("startEvaluationRun", apiRoutes.startEvaluationRun(), { dataset_id: datasetId }, csrfToken)
  });
}
