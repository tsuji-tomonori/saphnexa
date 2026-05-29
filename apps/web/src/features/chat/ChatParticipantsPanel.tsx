import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button, DataTable, FormField, Input, Panel, StatusBadge } from "@saphnexa/ui";
import type { ChatParticipant } from "../../types";

const shareParticipantSchema = z.object({
  user_id: z.string().min(1, "共有先ユーザーIDは必須です")
});

type ShareParticipantFormValues = z.infer<typeof shareParticipantSchema>;

export function ChatParticipantsPanel(props: {
  activeChatId: string | null;
  csrfToken: string;
  participants: ChatParticipant[];
  isLoading: boolean;
  isMutating: boolean;
  onAdd: (input: { chat_id: string; user_id: string }) => Promise<unknown>;
  onUpdate: (input: { chat_id: string; user_id: string }) => void;
  onRemove: (input: { chat_id: string; user_id: string }) => void;
}) {
  const form = useForm<ShareParticipantFormValues>({
    resolver: zodResolver(shareParticipantSchema),
    defaultValues: { user_id: "" }
  });

  async function submit(values: ShareParticipantFormValues) {
    if (!props.activeChatId) return;
    await props.onAdd({ chat_id: props.activeChatId, user_id: values.user_id });
    form.reset({ user_id: "" });
  }

  return (
    <Panel aria-label="参加者">
      {props.isLoading ? <p role="status">参加者を確認しています</p> : null}
      <form aria-label="チャット共有フォーム" onSubmit={form.handleSubmit(submit)}>
        <Controller
          control={form.control}
          name="user_id"
          render={({ field, fieldState }) => (
            <FormField label="共有先ユーザーID" htmlFor="chat-share-user-id" help={fieldState.error?.message}>
              <Input id="chat-share-user-id" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <p role="status">owner移譲、owner昇格、実 AppSync Events fan-out: 未接続</p>
        <Button type="submit" disabled={!props.csrfToken || !props.activeChatId || props.isMutating}>viewerとして共有</Button>
      </form>
      <DataTable
        caption="参加者一覧"
        empty={props.activeChatId ? "参加者はありません" : "チャットを選択してください"}
        rows={props.participants.map((participant) => ({ ...participant, id: participant.user_id }))}
        columns={[
          { key: "user_id", header: "ユーザーID", render: (participant) => participant.user_id },
          { key: "participant_role", header: "ロール", render: (participant) => participant.participant_role },
          { key: "status", header: "状態", render: (participant) => <StatusBadge status={participant.status} /> },
          { key: "added_by_user_id", header: "共有者", render: (participant) => participant.added_by_user_id },
          { key: "added_at", header: "共有日時", render: (participant) => participant.added_at },
          {
            key: "actions",
            header: "操作",
            render: (participant) => participant.participant_role === "owner" ? "owner" : (
              <>
                <Button
                  type="button"
                  tone="secondary"
                  disabled={!props.csrfToken || !props.activeChatId || props.isMutating}
                  onClick={() => props.activeChatId ? props.onUpdate({ chat_id: props.activeChatId, user_id: participant.user_id }) : undefined}
                >
                  viewer再有効化
                </Button>
                <Button
                  type="button"
                  tone="secondary"
                  disabled={!props.csrfToken || !props.activeChatId || props.isMutating}
                  onClick={() => props.activeChatId ? props.onRemove({ chat_id: props.activeChatId, user_id: participant.user_id }) : undefined}
                >
                  共有解除
                </Button>
              </>
            )
          }
        ]}
      />
    </Panel>
  );
}
