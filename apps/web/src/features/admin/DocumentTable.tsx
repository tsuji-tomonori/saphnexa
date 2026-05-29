import { DataTable, StatusBadge } from "@saphnexa/ui";
import type { AdminDocument } from "../../types";

export function DocumentTable(props: { documents: AdminDocument[] }) {
  return (
    <DataTable
      caption="文書一覧"
      empty="文書はありません"
      rows={props.documents.map((document) => ({ ...document, id: document.document_id }))}
      columns={[
        { key: "title", header: "文書名", render: (document) => document.title },
        { key: "status", header: "状態", render: (document) => <StatusBadge status={document.status} /> },
        { key: "updated_at", header: "更新日時", render: (document) => document.updated_at },
        { key: "created_by_user_id", header: "登録者", render: (document) => document.created_by_user_id }
      ]}
    />
  );
}
