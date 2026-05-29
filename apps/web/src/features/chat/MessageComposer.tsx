import { Button, FormField, Panel, Textarea } from "@saphnexa/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export function MessageComposer(props: {
  csrfToken: string;
  onSubmit: (question: string) => void;
}) {
  const form = useForm<QuestionForm>({
    defaultValues: { question: "" },
    resolver: zodResolver(questionSchema)
  });
  const question = form.watch("question");

  return (
    <Panel aria-label="質問入力">
      <FormField label="質問" htmlFor="chat-question">
        <Textarea id="chat-question" value={question} onChange={(value) => form.setValue("question", value, { shouldValidate: true })} aria-label="質問" />
      </FormField>
      {form.formState.errors.question ? <p role="alert">{form.formState.errors.question.message}</p> : null}
      <Button onClick={form.handleSubmit((value) => props.onSubmit(value.question))} disabled={!props.csrfToken || !question}>送信</Button>
    </Panel>
  );
}

const questionSchema = z.object({
  question: z.string().trim().min(1, "質問を入力してください").max(2000, "質問は2000文字以内で入力してください")
});

type QuestionForm = z.infer<typeof questionSchema>;
