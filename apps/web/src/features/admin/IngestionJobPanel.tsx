import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Dialog, FormField, Input, StatusBadge } from "@saphnexa/ui";
import { useIngestionJob, useRetryIngestionJob } from "../../hooks/useIngestionJob";

const ingestionJobLookupSchema = z.object({
  job_id: z.string().min(1, "取り込みジョブIDは必須です")
});

type IngestionJobLookupValues = z.infer<typeof ingestionJobLookupSchema>;

export function IngestionJobPanel(props: { csrfToken: string }) {
  const [selectedJobId, setSelectedJobId] = useState("");
  const form = useForm<IngestionJobLookupValues>({
    resolver: zodResolver(ingestionJobLookupSchema),
    defaultValues: { job_id: "" }
  });
  const watchedJobId = form.watch("job_id");
  const jobQuery = useIngestionJob(selectedJobId);
  const retry = useRetryIngestionJob(props.csrfToken, selectedJobId);
  const job = retry.data?.job ?? jobQuery.data?.job;
  const errorMessage = jobQuery.error instanceof Error ? jobQuery.error.message : retry.error instanceof Error ? retry.error.message : "";

  return (
    <section aria-label="取り込みジョブ確認">
      <form aria-label="取り込みジョブ確認フォーム" onSubmit={form.handleSubmit((values) => setSelectedJobId(values.job_id))}>
        <Controller
          control={form.control}
          name="job_id"
          render={({ field, fieldState }) => (
            <FormField label="取り込みジョブID" htmlFor="ingestion-job-id" help={fieldState.error?.message}>
              <Input id="ingestion-job-id" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <Button type="submit" disabled={!watchedJobId || jobQuery.isFetching}>状態確認</Button>
      </form>
      {!job && !jobQuery.isFetching ? <p role="status">取り込みジョブを選択してください</p> : null}
      {job ? (
        <dl>
          <dt>状態</dt>
          <dd><StatusBadge status={job.status} /></dd>
          <dt>進捗</dt>
          <dd>{job.progress_percent}%</dd>
          <dt>文書</dt>
          <dd>{job.document_id}</dd>
          <dt>版</dt>
          <dd>{job.version_id}</dd>
          <dt>raw</dt>
          <dd>{job.raw_s3_uri}</dd>
          <dt>parsed</dt>
          <dd>{job.parsed_s3_prefix}</dd>
          <dt>失敗理由</dt>
          <dd>{job.error_code ?? "なし"}</dd>
        </dl>
      ) : null}
      <Button onClick={() => retry.mutate()} disabled={!props.csrfToken || !job?.retryable || retry.isPending}>再実行</Button>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <Dialog open={jobQuery.isFetching || retry.isPending} title="取り込みジョブ">
        <p role="status">取り込みジョブを確認しています</p>
      </Dialog>
    </section>
  );
}
