import { useQuery } from "@tanstack/react-query";
import { apiGetOperation, apiRoutes } from "@saphnexa/api-client";
import type { AdminDocument } from "../types";

export function useAdminDocuments() {
  return useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const response = await apiGetOperation("adminListDocuments", apiRoutes.adminListDocuments());
      return { documents: response.documents satisfies AdminDocument[] };
    }
  });
}
