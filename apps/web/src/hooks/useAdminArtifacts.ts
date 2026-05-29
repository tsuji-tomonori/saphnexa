import { useQuery } from "@tanstack/react-query";
import { apiGetOperation, apiRoutes } from "@saphnexa/api-client";
import type { Artifact } from "../types";

export function useAdminArtifacts() {
  return useQuery({
    queryKey: ["admin-artifacts"],
    queryFn: async () => {
      const response = await apiGetOperation("listPublishedArtifacts", apiRoutes.listPublishedArtifacts());
      return { artifacts: response.artifacts satisfies Artifact[] };
    }
  });
}
