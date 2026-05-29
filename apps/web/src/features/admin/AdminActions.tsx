import { useState } from "react";
import { Button, DataTable, Dialog, FormField, Input, Panel, StatusBadge } from "@saphnexa/ui";
import { useEvaluationDatasets, useEvaluationRun, useStartEvaluationRun } from "../../hooks/useStartEvaluationRun";

export function AdminActions(props: { csrfToken: string }) {
  const [datasetId, setDatasetId] = useState("");
  const [evaluationRunId, setEvaluationRunId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState("idle");
  const datasets = useEvaluationDatasets();
  const evaluationRun = useEvaluationRun(evaluationRunId);
  const evaluation = useStartEvaluationRun(props.csrfToken);

  async function startEvaluation() {
    const response = await evaluation.mutateAsync(datasetId);
    setEvaluationRunId(response.evaluation_run.evaluation_run_id);
    setJobStatus(response.evaluation_run.status);
  }

  return (
    <Panel aria-label="管理操作">
      {datasets.isFetching ? <p role="status">評価データセットを確認しています</p> : null}
      <DataTable
        caption="評価データセット一覧"
        empty="評価データセットはありません"
        rows={(datasets.data?.datasets ?? []).map((dataset) => ({ ...dataset, id: dataset.dataset_id }))}
        columns={[
          { key: "dataset_id", header: "データセットID", render: (dataset) => dataset.dataset_id },
          { key: "dataset_name", header: "名称", render: (dataset) => dataset.dataset_name },
          { key: "status", header: "状態", render: (dataset) => <StatusBadge status={dataset.status} /> },
          { key: "source_s3_uri", header: "S3 URI", render: (dataset) => dataset.source_s3_uri },
          {
            key: "actions",
            header: "操作",
            render: (dataset) => (
              <Button type="button" tone="secondary" disabled={!props.csrfToken || evaluation.isPending} onClick={() => setDatasetId(dataset.dataset_id)}>
                選択
              </Button>
            )
          }
        ]}
      />
      <FormField label="評価データセットID" htmlFor="evaluation-dataset-id">
        <Input id="evaluation-dataset-id" value={datasetId} onChange={setDatasetId} />
      </FormField>
      <Button onClick={startEvaluation} disabled={!props.csrfToken || !datasetId}>評価実行</Button>
      <StatusBadge status={jobStatus} />
      <FormField label="評価run ID" htmlFor="evaluation-run-id">
        <Input id="evaluation-run-id" value={evaluationRunId ?? ""} onChange={(value) => setEvaluationRunId(value || null)} />
      </FormField>
      <p role="status">Step Functions評価runner、Bedrock Evaluations job、評価HTML report、AppSync fan-out: 未接続</p>
      <DataTable
        caption="評価run詳細"
        empty={evaluationRunId ? "評価runはありません" : "評価runを選択してください"}
        rows={evaluationRun.data?.evaluation_run ? [{ ...evaluationRun.data.evaluation_run, id: evaluationRun.data.evaluation_run.evaluation_run_id }] : []}
        columns={[
          { key: "evaluation_run_id", header: "評価run ID", render: (run) => run.evaluation_run_id },
          { key: "dataset_id", header: "データセットID", render: (run) => run.dataset_id },
          { key: "model_id", header: "モデル", render: (run) => run.model_id },
          { key: "status", header: "状態", render: (run) => <StatusBadge status={run.status} /> },
          { key: "metrics_json", header: "metrics", render: (run) => JSON.stringify(run.metrics_json) },
          { key: "artifact_s3_prefix", header: "成果物prefix", render: (run) => run.artifact_s3_prefix }
        ]}
      />
      <DataTable
        caption="評価case別結果"
        empty={evaluationRunId ? "評価case別結果はありません" : "評価runを選択してください"}
        rows={(evaluationRun.data?.items ?? []).map((item) => ({ ...item, id: item.case_id }))}
        columns={[
          { key: "case_id", header: "case ID", render: (item) => item.case_id },
          { key: "status", header: "状態", render: (item) => <StatusBadge status={item.status} /> },
          { key: "answer_text", header: "回答", render: (item) => item.answer_text ?? "未設定" },
          { key: "metrics_json", header: "metrics", render: (item) => JSON.stringify(item.metrics_json ?? {}) },
          { key: "judge_result_json", header: "judge", render: (item) => JSON.stringify(item.judge_result_json ?? {}) }
        ]}
      />
      <Dialog open={evaluation.isPending} title="評価実行">
        <p role="status">評価実行を開始しています</p>
      </Dialog>
    </Panel>
  );
}
