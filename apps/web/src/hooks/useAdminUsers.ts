import { useQuery } from "@tanstack/react-query";
import { apiGetOperation, apiRoutes } from "@saphnexa/api-client";
import type { AdminUser } from "../types";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await apiGetOperation("adminListUsers", apiRoutes.adminListUsers());
      return { users: response.users satisfies AdminUser[] };
    }
  });
}
