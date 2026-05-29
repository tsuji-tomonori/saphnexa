import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@saphnexa/api-client";
import type { Artifact } from "../types";

export function useAdminArtifacts() {
  return useQuery({
    queryKey: ["admin-artifacts"],
    queryFn: () => apiGet<{ artifacts: Artifact[] }>("/api/admin/artifacts")
  });
}
