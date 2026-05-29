import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPostOperation, apiRoutes } from "@saphnexa/api-client";

export type CreateDocumentInput = {
  title: string;
  file_name: string;
  version_label?: string | undefined;
  acl_scope_id?: string | undefined;
  document_type?: string | undefined;
  valid_from?: string | undefined;
  valid_until?: string | undefined;
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
  const metadata = {
    ...(input.document_type ? { document_type: input.document_type } : {}),
    ...(input.valid_from ? { valid_from: input.valid_from } : {}),
    ...(input.valid_until ? { valid_until: input.valid_until } : {})
  };
  return {
    title: input.title,
    file_name: input.file_name,
    ...(input.version_label ? { version_label: input.version_label } : {}),
    ...(input.acl_scope_id ? { acl_scope_id: input.acl_scope_id } : {}),
    ...(Object.keys(metadata).length > 0 ? { metadata } : {})
  };
}
