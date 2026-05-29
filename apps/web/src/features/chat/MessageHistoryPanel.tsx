import { Button, MessageThread, StatusBadge } from "@saphnexa/ui";
import type { ChatMessage } from "../../types";

export function MessageHistoryPanel(props: {
  activeChatId: string | null;
  activeMessageId: string | null;
  csrfToken: string;
  messages: ChatMessage[];
  nextCursor: string | null;
  isLoading: boolean;
  isCanceling: boolean;
  onCancel: (input: { chat_id: string; message_id: string }) => void;
}) {
  return (
    <>
      {props.isLoading ? <p role="status">メッセージ履歴を確認しています</p> : null}
      <p role="status">引用本文の完全 REST 復元: 未接続</p>
      {props.nextCursor ? <p role="status">次ページcursor: {props.nextCursor}</p> : null}
      <p role="status">実 AgentCore Runtime 停止、SQS event-publish、stream中断: 未接続</p>
      <Button
        type="button"
        tone="secondary"
        disabled={!props.csrfToken || !props.activeChatId || !props.activeMessageId || props.isCanceling}
        onClick={() => props.activeChatId && props.activeMessageId ? props.onCancel({ chat_id: props.activeChatId, message_id: props.activeMessageId }) : undefined}
      >
        回答生成キャンセル要求
      </Button>
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
              {message.feedback ? (
                <p role="status">
                  フィードバック: {message.feedback.rating}
                  {message.feedback.comment ? ` / ${message.feedback.comment}` : ""}
                </p>
              ) : null}
              <StatusBadge status={message.status} />
              <small>{message.created_at}</small>
            </>
          )
        }))}
      />
    </>
  );
}
