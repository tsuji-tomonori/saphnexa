import { DataTable, Panel, StatusBadge } from "@saphnexa/ui";
import type { ChatParticipant } from "../../types";

export function ChatParticipantsPanel(props: { activeChatId: string | null; participants: ChatParticipant[]; isLoading: boolean }) {
  return (
    <Panel aria-label="参加者">
      {props.isLoading ? <p role="status">参加者を確認しています</p> : null}
      <DataTable
        caption="参加者一覧"
        empty={props.activeChatId ? "参加者はありません" : "チャットを選択してください"}
        rows={props.participants.map((participant) => ({ ...participant, id: participant.user_id }))}
        columns={[
          { key: "user_id", header: "ユーザーID", render: (participant) => participant.user_id },
          { key: "participant_role", header: "ロール", render: (participant) => participant.participant_role },
          { key: "status", header: "状態", render: (participant) => <StatusBadge status={participant.status} /> },
          { key: "added_by_user_id", header: "共有者", render: (participant) => participant.added_by_user_id },
          { key: "added_at", header: "共有日時", render: (participant) => participant.added_at }
        ]}
      />
    </Panel>
  );
}
