import { DataTable, Drawer, StatusBadge } from "@saphnexa/ui";
import type { Artifact } from "../../types";

export function ArtifactTable(props: { artifacts: Artifact[] }) {
  return (
    <>
      <DataTable
        caption="成果物"
        rows={props.artifacts.map((artifact) => ({ ...artifact, id: artifact.artifact_id }))}
        empty="成果物はありません"
        columns={[
          { key: "title", header: "タイトル", render: (artifact) => <a href={artifact.viewer_path}>{artifact.title}</a> },
          { key: "type", header: "種別", render: (artifact) => artifact.artifact_type },
          { key: "status", header: "状態", render: (artifact) => <StatusBadge status={artifact.status} /> }
        ]}
      />
      <Drawer open={props.artifacts.length > 0} title="成果物詳細">
        <p role="status">成果物を選択すると詳細を表示します</p>
      </Drawer>
    </>
  );
}
