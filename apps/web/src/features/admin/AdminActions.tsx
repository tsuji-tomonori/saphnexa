import { useState } from "react";
import { Button, Dialog, FormField, Input, Panel, StatusBadge } from "../../../../../packages/ui/src/components";
import { useStartEvaluationRun } from "../../hooks/useStartEvaluationRun";

export function AdminActions(props: { csrfToken: string }) {
  const [datasetId, setDatasetId] = useState("");
  const [jobStatus, setJobStatus] = useState("idle");
  const evaluation = useStartEvaluationRun(props.csrfToken);

  async function startEvaluation() {
    const response = await evaluation.mutateAsync(datasetId);
    setJobStatus(response.evaluation_run.status);
  }

  return (
    <Panel aria-label="管理操作">
      <FormField label="評価データセットID" htmlFor="evaluation-dataset-id">
        <Input id="evaluation-dataset-id" value={datasetId} onChange={setDatasetId} />
      </FormField>
      <Button onClick={startEvaluation} disabled={!props.csrfToken || !datasetId}>評価実行</Button>
      <StatusBadge status={jobStatus} />
      <Dialog open={evaluation.isPending} title="評価実行">
        <p role="status">評価実行を開始しています</p>
      </Dialog>
    </Panel>
  );
}
