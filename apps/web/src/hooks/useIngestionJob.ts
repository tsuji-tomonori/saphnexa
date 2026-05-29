import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetOperation, apiPostOperation, apiRoutes } from "@saphnexa/api-client";
import type { IngestionJob } from "../types";

export function useIngestionJob(jobId: string) {
  return useQuery({
    queryKey: ["ingestion-job", jobId],
    enabled: Boolean(jobId),
    queryFn: async () => {
      const response = await apiGetOperation("getIngestionJob", apiRoutes.getIngestionJob(jobId));
      return { job: response.job satisfies IngestionJob };
    }
  });
}

export function useRetryIngestionJob(csrfToken: string, jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPostOperation("retryIngestionJob", apiRoutes.retryIngestionJob(jobId), {}, csrfToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ingestion-job", jobId] });
    }
  });
}
