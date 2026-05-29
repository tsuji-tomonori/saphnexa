import { MessageThread, StatusBadge } from "@saphnexa/ui";
import type { ChatMessage } from "../../types";

export function MessageHistoryPanel(props: { activeChatId: string | null; messages: ChatMessage[]; isLoading: boolean }) {
  return (
    <>
      {props.isLoading ? <p role="status">メッセージ履歴を確認しています</p> : null}
      <p role="status">paging cursor、feedback state、引用本文の完全 REST 復元: 未接続</p>
      <MessageThread
        aria-label="メッセージ履歴"
        emptyLabel={props.activeChatId ? "メッセージはありません" : "チャットを選択してください"}
        items={props.messages.map((message) => ({
          id: message.message_id,
          name: message.sender_type === "assistant" ? "assistant" : message.sender_user_id ?? message.sender_type,
          type: message.status,
          detail: (
            <>
              <p>{message.content_text || "本文未確定"}</p>
              <StatusBadge status={message.status} />
              <small>{message.created_at}</small>
            </>
          )
        }))}
      />
    </>
  );
}
