import { Button, MessageThread, StatusBadge } from "@saphnexa/ui";
import type { ChatMessage, Favorite } from "../../types";

export function MessageHistoryPanel(props: {
  activeChatId: string | null;
  activeMessageId: string | null;
  csrfToken: string;
  messages: ChatMessage[];
  favorites: Favorite[];
  nextCursor: string | null;
  isLoading: boolean;
  isCanceling: boolean;
  isFavoriteMutating: boolean;
  onCancel: (input: { chat_id: string; message_id: string }) => void;
  onAddMessageFavorite: (input: { chat_id: string; message_id: string }) => void;
  onDeleteFavorite: (favoriteId: string) => void;
}) {
  return (
    <>
      {props.isLoading ? <p role="status">メッセージ履歴を確認しています</p> : null}
      <p role="status">引用 REST 復元: 接続済み</p>
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
              {message.citations?.length ? <p role="status">引用: {message.citations.length}件</p> : null}
              {message.sender_type === "assistant" && props.activeChatId ? (
                <Button
                  type="button"
                  tone="secondary"
                  disabled={!props.csrfToken || props.isFavoriteMutating}
                  onClick={() => {
                    const favorite = props.favorites.find((item) => item.chat_id === props.activeChatId && item.message_id === message.message_id);
                    if (favorite) {
                      props.onDeleteFavorite(favorite.favorite_id);
                    } else if (props.activeChatId) {
                      props.onAddMessageFavorite({ chat_id: props.activeChatId, message_id: message.message_id });
                    }
                  }}
                >
                  {props.favorites.some((item) => item.chat_id === props.activeChatId && item.message_id === message.message_id) ? "回答お気に入り解除" : "回答お気に入り登録"}
                </Button>
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
