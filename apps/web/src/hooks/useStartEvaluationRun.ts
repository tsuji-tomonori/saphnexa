import { useMutation } from "@tanstack/react-query";
import { apiPost } from "../../../../packages/api-client/src/client";

export function useStartEvaluationRun(csrfToken: string) {
  return useMutation({
    mutationFn: (datasetId: string) =>
      apiPost<{ evaluation_run: { status: string } }>("/api/admin/evaluation-runs", { dataset_id: datasetId }, csrfToken)
  });
}
