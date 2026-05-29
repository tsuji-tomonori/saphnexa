import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button, DataTable, Dialog, FormField, Input, StatusBadge } from "@saphnexa/ui";
import {
  useActivateDocumentVersion,
  useCreateDocumentVersion,
  useDocumentDetail,
  useSuspendDocument,
  useUpdateDocumentAcl
} from "../../hooks/useDocumentLifecycle";

const documentLookupSchema = z.object({
  document_id: z.string().min(1, "文書IDは必須です")
});

const versionSchema = z.object({
  version_id: z.string().optional(),
  version_label: z.string().optional(),
  file_name: z.string().min(1, "PDFファイル名は必須です").regex(/\.pdf$/i, "PDFファイル名は .pdf で終わる必要があります"),
  acl_scope_id: z.string().optional()
});

const aclSchema = z.object({
  version_id: z.string().min(1, "文書版IDは必須です"),
  acl_scope_id: z.string().min(1, "ACL scopeは必須です")
});

type DocumentLookupValues = z.infer<typeof documentLookupSchema>;
type VersionValues = z.infer<typeof versionSchema>;
type AclValues = z.infer<typeof aclSchema>;

export function DocumentVersionLifecyclePanel(props: { csrfToken: string }) {
  const lookupForm = useForm<DocumentLookupValues>({
    resolver: zodResolver(documentLookupSchema),
    defaultValues: { document_id: "" }
  });
  const versionForm = useForm<VersionValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: { version_id: "", version_label: "", file_name: "", acl_scope_id: "" }
  });
  const aclForm = useForm<AclValues>({
    resolver: zodResolver(aclSchema),
    defaultValues: { version_id: "", acl_scope_id: "" }
  });
  const [documentId, setDocumentId] = useState("");
  const lookupDocumentId = lookupForm.watch("document_id").trim();
  const aclVersionId = aclForm.watch("version_id").trim();
  const aclScopeId = aclForm.watch("acl_scope_id").trim();
  const detail = useDocumentDetail(documentId);
  const createVersion = useCreateDocumentVersion(props.csrfToken);
  const activateVersion = useActivateDocumentVersion(props.csrfToken);
  const updateDocumentAcl = useUpdateDocumentAcl(props.csrfToken);
  const suspendDocument = useSuspendDocument(props.csrfToken);
  const document = detail.data?.document;
  const errorMessage =
    errorText(detail.error) || errorText(createVersion.error) || errorText(activateVersion.error) || errorText(updateDocumentAcl.error) || errorText(suspendDocument.error);

  function submitLookup(values: DocumentLookupValues) {
    setDocumentId(values.document_id.trim());
  }

  async function submitVersion(values: VersionValues) {
    if (!documentId) return;
    await createVersion.mutateAsync({ document_id: documentId, ...values });
    versionForm.reset({ version_id: "", version_label: "", file_name: "", acl_scope_id: "" });
  }

  async function submitAcl(values: AclValues) {
    if (!documentId) return;
    await updateDocumentAcl.mutateAsync({ document_id: documentId, version_id: values.version_id, acl_scope_id: values.acl_scope_id });
    aclForm.reset({ version_id: "", acl_scope_id: "" });
  }

  return (
    <>
      <section aria-label="文書版ライフサイクル">
        <form aria-label="文書詳細検索フォーム" onSubmit={lookupForm.handleSubmit(submitLookup)}>
          <Controller
            control={lookupForm.control}
            name="document_id"
            render={({ field, fieldState }) => (
              <FormField label="文書ID" htmlFor="lifecycle-document-id" help={fieldState.error?.message}>
                <Input id="lifecycle-document-id" value={field.value} onChange={field.onChange} />
              </FormField>
            )}
          />
          <Button type="submit" disabled={!lookupDocumentId || detail.isFetching}>文書詳細を確認</Button>
        </form>

        {detail.isFetching ? <p role="status">文書詳細を確認しています</p> : null}
        {document ? (
          <>
            <dl aria-label="文書詳細">
              <dt>文書名</dt>
              <dd>{document.title}</dd>
              <dt>状態</dt>
              <dd><StatusBadge status={document.status} /></dd>
              <dt>登録者</dt>
              <dd>{document.created_by_user_id}</dd>
            </dl>
            <p role="status">物理削除、S3 object delete、Bedrock KB / S3 Vectors delete: 未接続</p>
            <Button
              type="button"
              disabled={!props.csrfToken || document.status === "deleted" || suspendDocument.isPending}
              onClick={() => suspendDocument.mutate({ document_id: document.document_id })}
            >
              文書を公開停止
            </Button>
            <form aria-label="文書版追加フォーム" onSubmit={versionForm.handleSubmit(submitVersion)}>
              <Controller
                control={versionForm.control}
                name="version_id"
                render={({ field }) => (
                  <FormField label="文書版ID" htmlFor="lifecycle-version-id">
                    <Input id="lifecycle-version-id" value={field.value ?? ""} onChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={versionForm.control}
                name="version_label"
                render={({ field }) => (
                  <FormField label="版ラベル" htmlFor="lifecycle-version-label">
                    <Input id="lifecycle-version-label" value={field.value ?? ""} onChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={versionForm.control}
                name="file_name"
                render={({ field, fieldState }) => (
                  <FormField label="PDFファイル名" htmlFor="lifecycle-file-name" help={fieldState.error?.message}>
                    <Input id="lifecycle-file-name" value={field.value} onChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={versionForm.control}
                name="acl_scope_id"
                render={({ field }) => (
                  <FormField label="ACL scope" htmlFor="lifecycle-acl-scope">
                    <Input id="lifecycle-acl-scope" value={field.value ?? ""} onChange={field.onChange} />
                  </FormField>
                )}
              />
              <p role="status">PDF実アップロードとStep Functions実行: 未接続</p>
              <Button type="submit" disabled={!props.csrfToken || !documentId || createVersion.isPending}>文書版追加</Button>
            </form>
            <form aria-label="文書ACL更新フォーム" onSubmit={aclForm.handleSubmit(submitAcl)}>
              <Controller
                control={aclForm.control}
                name="version_id"
                render={({ field, fieldState }) => (
                  <FormField label="ACL更新対象 文書版ID" htmlFor="lifecycle-acl-version-id" help={fieldState.error?.message}>
                    <Input id="lifecycle-acl-version-id" value={field.value} onChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={aclForm.control}
                name="acl_scope_id"
                render={({ field, fieldState }) => (
                  <FormField label="更新後 ACL scope" htmlFor="lifecycle-acl-update-scope" help={fieldState.error?.message}>
                    <Input id="lifecycle-acl-update-scope" value={field.value} onChange={field.onChange} />
                  </FormField>
                )}
              />
              <p role="status">Cognito group反映、Bedrock KB / S3 Vectors metadata再同期: 未接続</p>
              <Button
                type="submit"
                disabled={!props.csrfToken || !documentId || !aclVersionId || !aclScopeId || updateDocumentAcl.isPending}
              >
                ACL更新
              </Button>
            </form>
            <DataTable
              caption="文書版一覧"
              empty="文書版はありません"
              rows={document.versions.map((version) => ({ ...version, id: version.version_id }))}
              columns={[
                { key: "version_label", header: "版", render: (version) => version.version_label },
                { key: "version_id", header: "文書版ID", render: (version) => version.version_id },
                { key: "status", header: "状態", render: (version) => <StatusBadge status={version.status} /> },
                { key: "raw_s3_uri", header: "原本URI", render: (version) => version.raw_s3_uri },
                {
                  key: "action",
                  header: "操作",
                  render: (version) => (
                    <Button
                      type="button"
                      disabled={!props.csrfToken || version.status !== "succeeded" || activateVersion.isPending}
                      onClick={() => activateVersion.mutate({ document_id: document.document_id, version_id: version.version_id })}
                    >
                      active化
                    </Button>
                  )
                }
              ]}
            />
            <DataTable
              caption="文書ACL一覧"
              empty="ACLはありません"
              rows={document.acl_entries.map((entry) => ({ ...entry, id: `${entry.version_id}:${entry.acl_scope_id}` }))}
              columns={[
                { key: "version_id", header: "文書版ID", render: (entry) => entry.version_id },
                { key: "acl_scope_id", header: "ACL scope", render: (entry) => entry.acl_scope_id },
                { key: "effect", header: "効果", render: (entry) => entry.effect }
              ]}
            />
            <DataTable
              caption="文書取り込みジョブ一覧"
              empty="取り込みジョブはありません"
              rows={document.ingestion_jobs.map((job) => ({ ...job, id: job.job_id }))}
              columns={[
                { key: "job_id", header: "ジョブID", render: (job) => job.job_id },
                { key: "version_id", header: "文書版ID", render: (job) => job.version_id },
                { key: "status", header: "状態", render: (job) => <StatusBadge status={job.status} /> },
                { key: "error_code", header: "エラー", render: (job) => job.error_code ?? "なし" }
              ]}
            />
          </>
        ) : null}
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      </section>
      <Dialog open={createVersion.isPending || activateVersion.isPending || updateDocumentAcl.isPending || suspendDocument.isPending} title="文書版ライフサイクル">
        <p role="status">文書版の状態を更新しています</p>
      </Dialog>
    </>
  );
}

function errorText(error: unknown): string {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return "文書版ライフサイクル処理に失敗しました";
}
