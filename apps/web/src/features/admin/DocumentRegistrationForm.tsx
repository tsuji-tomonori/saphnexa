import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Dialog, FormField, Input, StatusBadge } from "@saphnexa/ui";
import { useCreateDocument } from "../../hooks/useCreateDocument";

const documentRegistrationSchema = z.object({
  title: z.string().min(1, "文書名は必須です"),
  file_name: z.string().min(1, "PDFファイル名は必須です").regex(/\.pdf$/i, "PDFファイル名は .pdf で終わる必要があります"),
  version_label: z.string().optional(),
  acl_scope_id: z.string().optional(),
  document_type: z.string().min(1, "文書種別は必須です"),
  valid_from: z.string().min(1, "有効開始日は必須です"),
  valid_until: z.string().min(1, "有効終了日は必須です")
});

type DocumentRegistrationFormValues = z.infer<typeof documentRegistrationSchema>;

export function DocumentRegistrationForm(props: { csrfToken: string }) {
  const createDocument = useCreateDocument(props.csrfToken);
  const form = useForm<DocumentRegistrationFormValues>({
    resolver: zodResolver(documentRegistrationSchema),
    defaultValues: {
      title: "",
      file_name: "",
      version_label: "v1",
      acl_scope_id: "",
      document_type: "",
      valid_from: "",
      valid_until: ""
    }
  });

  async function submit(values: DocumentRegistrationFormValues) {
    await createDocument.mutateAsync(values);
    form.reset({ title: "", file_name: "", version_label: "v1", acl_scope_id: "", document_type: "", valid_from: "", valid_until: "" });
  }

  const created = createDocument.data;
  const errorMessage = createDocument.error instanceof Error ? createDocument.error.message : "";

  return (
    <>
      <form aria-label="文書登録フォーム" onSubmit={form.handleSubmit(submit)}>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormField label="文書名" htmlFor="document-title" help={fieldState.error?.message}>
              <Input id="document-title" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="file_name"
          render={({ field, fieldState }) => (
            <FormField label="PDFファイル名" htmlFor="document-file-name" help={fieldState.error?.message}>
              <Input id="document-file-name" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="version_label"
          render={({ field }) => (
            <FormField label="版ラベル" htmlFor="document-version-label">
              <Input id="document-version-label" value={field.value ?? ""} onChange={field.onChange} />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="acl_scope_id"
          render={({ field }) => (
            <FormField label="ACL scope" htmlFor="document-acl-scope">
              <Input id="document-acl-scope" value={field.value ?? ""} onChange={field.onChange} />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="document_type"
          render={({ field, fieldState }) => (
            <FormField label="文書種別" htmlFor="document-type" help={fieldState.error?.message}>
              <Input id="document-type" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="valid_from"
          render={({ field, fieldState }) => (
            <FormField label="有効開始日" htmlFor="document-valid-from" help={fieldState.error?.message}>
              <Input id="document-valid-from" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="valid_until"
          render={({ field, fieldState }) => (
            <FormField label="有効終了日" htmlFor="document-valid-until" help={fieldState.error?.message}>
              <Input id="document-valid-until" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <p role="status">PDF実アップロード: 未接続</p>
        <Button type="submit" disabled={!props.csrfToken || createDocument.isPending}>文書登録</Button>
        {created ? <StatusBadge status={`queued:${created.job_id}`} /> : null}
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      </form>
      <Dialog open={createDocument.isPending} title="文書登録">
        <p role="status">文書登録を開始しています</p>
      </Dialog>
    </>
  );
}
