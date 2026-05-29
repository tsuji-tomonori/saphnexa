import { DataTable, StatusBadge } from "@saphnexa/ui";
import type { AdminUser } from "../../types";

export function UserTable(props: { users: AdminUser[] }) {
  return (
    <DataTable
      caption="ユーザー一覧"
      empty="ユーザーはありません"
      rows={props.users.map((user) => ({ ...user, id: user.user_id }))}
      columns={[
        { key: "email", header: "メール", render: (user) => user.email },
        { key: "display_name", header: "表示名", render: (user) => user.display_name },
        { key: "role", header: "ロール", render: (user) => user.role },
        { key: "status", header: "状態", render: (user) => <StatusBadge status={user.status} /> }
      ]}
    />
  );
}
