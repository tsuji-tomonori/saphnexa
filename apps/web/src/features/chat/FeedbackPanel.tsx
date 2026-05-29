import { useState } from "react";
import { Button, Panel, Textarea } from "@saphnexa/ui";

export function FeedbackPanel(props: {
  activeChatId: string | null;
  activeMessageId: string | null;
  csrfToken: string;
  isPending: boolean;
  submittedRating?: string | undefined;
  onSubmit: (input: { chatId: string; messageId: string; rating: "positive" | "negative"; comment?: string | undefined }) => void;
}) {
  const [comment, setComment] = useState("");
  const disabled = !props.csrfToken || !props.activeChatId || !props.activeMessageId || props.isPending;

  function submit(rating: "positive" | "negative") {
    if (!props.activeChatId || !props.activeMessageId) return;
    props.onSubmit({ chatId: props.activeChatId, messageId: props.activeMessageId, rating, comment: comment.trim() || undefined });
  }

  return (
    <Panel aria-label="回答フィードバック">
      {props.submittedRating ? <p role="status">フィードバックを登録しました: {props.submittedRating}</p> : null}
      {props.isPending ? <p role="status">フィードバックを送信しています</p> : null}
      <Textarea aria-label="フィードバックコメント" value={comment} onChange={setComment} />
      <Button type="button" tone="secondary" disabled={disabled} onClick={() => submit("positive")}>
        高評価
      </Button>
      <Button type="button" tone="secondary" disabled={disabled} onClick={() => submit("negative")}>
        低評価
      </Button>
    </Panel>
  );
}
