import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button, DataTable, Dialog, FormField, StatusBadge, Textarea } from "@saphnexa/ui";
import { useStartUserImport, useUserImportResult } from "../../hooks/useUserImport";

const userImportSchema = z.object({
  rows_json: z.string().min(2, "JSON rows は必須です").refine((value) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) && parsed.every((row) => row && typeof row === "object" && !Array.isArray(row));
    } catch {
      return false;
    }
  }, "JSON object 配列を入力してください")
});

type UserImportFormValues = z.infer<typeof userImportSchema>;

export function UserImportPanel(props: { csrfToken: string }) {
  const [importId, setImportId] = useState("");
  const startImport = useStartUserImport(props.csrfToken);
  const importResult = useUserImportResult(importId);
  const form = useForm<UserImportFormValues>({
    resolver: zodResolver(userImportSchema),
    defaultValues: {
      rows_json: JSON.stringify([{ action: "create", email: "new.user@example.com", display_name: "新規ユーザー" }], null, 2)
    }
  });

  async function submit(values: UserImportFormValues) {
    const rows = JSON.parse(values.rows_json);
    const response = await startImport.mutateAsync(rows);
    setImportId(response.import.import_id);
  }

  const job = importResult.data?.import ?? startImport.data?.import;
  const rows = importResult.data?.rows ?? [];
  const errorMessage = startImport.error instanceof Error ? startImport.error.message : importResult.error instanceof Error ? importResult.error.message : "";

  return (
    <section aria-label="ユーザー取込">
      <form aria-label="ユーザー取込フォーム" onSubmit={form.handleSubmit(submit)}>
        <Controller
          control={form.control}
          name="rows_json"
          render={({ field, fieldState }) => (
            <FormField label="JSON rows" htmlFor="user-import-rows" help={fieldState.error?.message}>
              <Textarea id="user-import-rows" aria-label="JSON rows" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <p role="status">CSV/Excel実アップロード: 未接続</p>
        <Button type="submit" disabled={!props.csrfToken || startImport.isPending}>ユーザー取込</Button>
      </form>
      {job ? (
        <dl>
          <dt>取込ID</dt>
          <dd>{job.import_id}</dd>
          <dt>状態</dt>
          <dd><StatusBadge status={job.status} /></dd>
          <dt>成功</dt>
          <dd>{job.result_report_json.created + job.result_report_json.updated + job.result_report_json.deleted}</dd>
          <dt>失敗</dt>
          <dd>{job.result_report_json.failed}</dd>
          <dt>結果prefix</dt>
          <dd>{job.result_s3_prefix}</dd>
        </dl>
      ) : null}
      <DataTable
        caption="ユーザー取込結果"
        empty="取込結果はありません"
        rows={rows.map((row) => ({ ...row, id: String(row.row_number) }))}
        columns={[
          { key: "row_number", header: "行", render: (row) => row.row_number },
          { key: "action", header: "操作", render: (row) => row.action },
          { key: "status", header: "状態", render: (row) => <StatusBadge status={row.status} /> },
          { key: "target_user_id", header: "対象", render: (row) => row.target_user_id ?? "なし" },
          { key: "error_message", header: "エラー", render: (row) => row.error_message ?? "なし" }
        ]}
      />
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <Dialog open={startImport.isPending || importResult.isFetching} title="ユーザー取込">
        <p role="status">ユーザー取込を確認しています</p>
      </Dialog>
    </section>
  );
}
