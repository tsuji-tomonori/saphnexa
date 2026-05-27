import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../../../packages/api-client/src/client";
import { Button, Panel, StatusBadge } from "../../../../packages/ui/src/components";

type Artifact = { artifact_id: string; artifact_type: string; title: string; viewer_path: string; status: string };

export function AdminApp() {
  const [csrfToken, setCsrfToken] = useState("");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [jobStatus, setJobStatus] = useState<string>("idle");

  useEffect(() => {
    void apiGet<{ csrf_token: string }>("/api/me").then((me) => setCsrfToken(me.csrf_token));
    void apiGet<{ artifacts: Artifact[] }>("/api/admin/artifacts").then((data) => setArtifacts(data.artifacts));
  }, []);

  async function startEvaluation() {
    const response = await apiPost<{ evaluation_run: { status: string } }>("/api/admin/evaluation-runs", { dataset_id: "dataset-local-golden" }, csrfToken);
    setJobStatus(response.evaluation_run.status);
  }

  return (
    <main className="sx-admin-shell">
      <Panel aria-label="管理操作">
        <Button onClick={startEvaluation} disabled={!csrfToken}>評価実行</Button>
        <StatusBadge status={jobStatus} />
      </Panel>
      <Panel aria-label="成果物">
        {artifacts.length === 0 ? (
          <p role="status">成果物はありません</p>
        ) : (
          artifacts.map((artifact) => (
            <a key={artifact.artifact_id} href={artifact.viewer_path}>{artifact.title}<StatusBadge status={artifact.status} /></a>
          ))
        )}
      </Panel>
    </main>
  );
}
