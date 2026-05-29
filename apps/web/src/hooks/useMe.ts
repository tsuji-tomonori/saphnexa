import { useQuery } from "@tanstack/react-query";
import { apiGetOperation, apiRoutes } from "@saphnexa/api-client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGetOperation("getMe", apiRoutes.getMe())
  });
}
