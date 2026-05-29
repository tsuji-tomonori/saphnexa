import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetOperation, apiPostOperation, apiRoutes } from "@saphnexa/api-client";
import type { EvaluationDataset, EvaluationRun, EvaluationRunItem, LlmModel } from "../types";

export function useLlmModels() {
  return useQuery({
    queryKey: ["llm-models"],
    queryFn: async () => {
      const response = await apiGetOperation("listLlmModels", apiRoutes.listLlmModels());
      return { models: response.models satisfies LlmModel[] };
    }
  });
}

export function useEvaluationDatasets() {
  return useQuery({
    queryKey: ["evaluation-datasets"],
    queryFn: async () => {
      const response = await apiGetOperation("listEvaluationDatasets", apiRoutes.listEvaluationDatasets());
      return { datasets: response.datasets satisfies EvaluationDataset[] };
    }
  });
}

export function useEvaluationRun(evaluationRunId: string | null) {
  return useQuery({
    queryKey: ["evaluation-run", evaluationRunId],
    enabled: Boolean(evaluationRunId),
    queryFn: async () => {
      const response = await apiGetOperation("getEvaluationRun", apiRoutes.getEvaluationRun(evaluationRunId ?? ""));
      return {
        evaluation_run: response.evaluation_run satisfies EvaluationRun | undefined,
        items: response.items satisfies EvaluationRunItem[]
      };
    }
  });
}

export function useStartEvaluationRun(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { datasetId: string; modelId: string }) =>
      apiPostOperation("startEvaluationRun", apiRoutes.startEvaluationRun(), { dataset_id: input.datasetId, model_id: input.modelId }, csrfToken),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["evaluation-run", data.evaluation_run.evaluation_run_id] });
    }
  });
}
