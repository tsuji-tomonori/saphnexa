import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetOperation, apiPostOperation, apiRoutes } from "@saphnexa/api-client";
import type { AdminDocumentDetail, DocumentVersion } from "../types";

export type CreateDocumentVersionInput = {
  document_id: string;
  version_id?: string | undefined;
  version_label?: string | undefined;
  file_name: string;
  acl_scope_id?: string | undefined;
};

export function useDocumentDetail(documentId: string) {
  return useQuery({
    queryKey: ["admin-document-detail", documentId],
    enabled: documentId.length > 0,
    queryFn: async () => {
      const response = await apiGetOperation("getDocument", apiRoutes.getDocument(documentId));
      return { document: response.document satisfies AdminDocumentDetail };
    }
  });
}

export function useCreateDocumentVersion(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocumentVersionInput) =>
      apiPostOperation("createDocumentVersion", apiRoutes.createDocumentVersion(input.document_id), pruneEmpty(input), csrfToken),
    onSuccess: async (_response, input) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-document-detail", input.document_id] });
    }
  });
}

export function useActivateDocumentVersion(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { document_id: string; version_id: string }) =>
      apiPostOperation("activateDocumentVersion", apiRoutes.activateDocumentVersion(input.document_id, input.version_id), {}, csrfToken),
    onSuccess: async (response, input) => {
      response.version satisfies DocumentVersion;
      await queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-document-detail", input.document_id] });
    }
  });
}

export function useSuspendDocument(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { document_id: string }) =>
      apiPostOperation("suspendDocument", apiRoutes.suspendDocument(input.document_id), {}, csrfToken),
    onSuccess: async (response, input) => {
      response.document satisfies AdminDocumentDetail;
      await queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-document-detail", input.document_id] });
    }
  });
}

function pruneEmpty(input: CreateDocumentVersionInput) {
  return {
    file_name: input.file_name,
    ...(input.version_id ? { version_id: input.version_id } : {}),
    ...(input.version_label ? { version_label: input.version_label } : {}),
    ...(input.acl_scope_id ? { acl_scope_id: input.acl_scope_id } : {})
  };
}
