import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetOperation, apiPostOperation, apiRoutes, type ApiClientJsonObject } from "@saphnexa/api-client";
import type { UserImportJob, UserImportRow } from "../types";

export function useUserImportResult(importId: string) {
  return useQuery({
    queryKey: ["user-import", importId],
    enabled: Boolean(importId),
    queryFn: async () => {
      const response = await apiGetOperation("getUserImport", apiRoutes.getUserImport(importId));
      return {
        import: response.import satisfies UserImportJob,
        rows: response.rows satisfies UserImportRow[]
      };
    }
  });
}

export function useStartUserImport(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: ApiClientJsonObject[]) =>
      apiPostOperation("startUserImport", apiRoutes.startUserImport(), { rows }, csrfToken),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["user-import", response.import.import_id] })
      ]);
    }
  });
}
