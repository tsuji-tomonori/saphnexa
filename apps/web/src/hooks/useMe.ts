import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../../packages/api-client/src/client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<{ user: unknown; csrf_token: string }>("/api/me")
  });
}
