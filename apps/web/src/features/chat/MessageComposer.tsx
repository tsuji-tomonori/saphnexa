import { Button, FormField, Panel, Textarea } from "@saphnexa/ui";

export function MessageComposer(props: {
  question: string;
  csrfToken: string;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Panel aria-label="質問入力">
      <FormField label="質問" htmlFor="chat-question">
        <Textarea value={props.question} onChange={props.onQuestionChange} aria-label="質問" />
      </FormField>
      <Button onClick={props.onSubmit} disabled={!props.csrfToken || !props.question}>送信</Button>
    </Panel>
  );
}
