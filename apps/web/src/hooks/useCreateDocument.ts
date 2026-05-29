import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPostOperation, apiRoutes } from "@saphnexa/api-client";

export type CreateDocumentInput = {
  title: string;
  file_name: string;
  version_label?: string | undefined;
  acl_scope_id?: string | undefined;
};

export function useCreateDocument(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocumentInput) =>
      apiPostOperation("createDocument", apiRoutes.createDocument(), pruneEmpty(input), csrfToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    }
  });
}

function pruneEmpty(input: CreateDocumentInput) {
  return {
    title: input.title,
    file_name: input.file_name,
    ...(input.version_label ? { version_label: input.version_label } : {}),
    ...(input.acl_scope_id ? { acl_scope_id: input.acl_scope_id } : {})
  };
}
