import { useQuery } from "@tanstack/react-query";
import { apiGet, apiRoutes } from "@saphnexa/api-client";
import type { Artifact } from "../types";

export function useAdminArtifacts() {
  return useQuery({
    queryKey: ["admin-artifacts"],
    queryFn: () => apiGet<{ artifacts: Artifact[] }>(apiRoutes.listPublishedArtifacts())
  });
}
