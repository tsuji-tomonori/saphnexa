import { useQuery } from "@tanstack/react-query";
import { apiGet, apiRoutes } from "@saphnexa/api-client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<{ user: unknown; csrf_token: string }>(apiRoutes.getMe())
  });
}
