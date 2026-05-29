import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button, FormField, Input, Sidebar, StatusBadge } from "@saphnexa/ui";
import type { Chat } from "../../types";

const chatTitleSchema = z.object({
  title: z.string().min(1, "チャットタイトルは必須です")
});

type ChatTitleFormValues = z.infer<typeof chatTitleSchema>;
const newChatSchema = z.object({
  title: z.string().min(1, "新規チャット名は必須です")
});
type NewChatFormValues = z.infer<typeof newChatSchema>;

export function ChatSessionNav(props: {
  chats: Chat[];
  selectedChatId: string | null;
  csrfToken: string;
  isMutating: boolean;
  onSelect: (chatId: string) => void;
  onCreate: (input: { title: string }) => Promise<unknown>;
  onUpdate: (input: { chat_id: string; title: string }) => Promise<unknown>;
  onDelete: (chatId: string) => void;
}) {
  const selectedChat = props.chats.find((chat) => chat.chat_id === props.selectedChatId);
  const form = useForm<ChatTitleFormValues>({
    resolver: zodResolver(chatTitleSchema),
    defaultValues: { title: selectedChat?.title ?? "" }
  });
  const createForm = useForm<NewChatFormValues>({
    resolver: zodResolver(newChatSchema),
    defaultValues: { title: "" }
  });

  useEffect(() => {
    form.reset({ title: selectedChat?.title ?? "" });
  }, [form, selectedChat?.title]);

  async function submit(values: ChatTitleFormValues) {
    if (!props.selectedChatId) return;
    await props.onUpdate({ chat_id: props.selectedChatId, title: values.title });
  }

  async function create(values: NewChatFormValues) {
    await props.onCreate({ title: values.title });
    createForm.reset({ title: "" });
  }

  return (
    <Sidebar aria-label="チャット一覧">
      <form aria-label="新規チャット作成フォーム" onSubmit={createForm.handleSubmit(create)}>
        <Controller
          control={createForm.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormField label="新規チャット名" htmlFor="new-chat-title" help={fieldState.error?.message}>
              <Input id="new-chat-title" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <p role="status">chat event append: 未接続</p>
        <Button type="submit" disabled={!props.csrfToken || props.isMutating}>新規チャット</Button>
      </form>
      <form aria-label="チャットタイトル更新フォーム" onSubmit={form.handleSubmit(submit)}>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormField label="チャットタイトル" htmlFor="chat-title" help={fieldState.error?.message}>
              <Input id="chat-title" value={field.value} onChange={field.onChange} />
            </FormField>
          )}
        />
        <p role="status">chat event table完全追記、保持期間後物理削除: 未接続</p>
        <Button type="submit" disabled={!props.csrfToken || !props.selectedChatId || props.isMutating}>タイトル更新</Button>
      </form>
      <nav aria-label="チャット一覧">
        {props.chats.length === 0 ? (
          <p role="status">チャットはありません</p>
        ) : (
          props.chats.map((chat) => (
            <div key={chat.chat_id}>
              <button type="button" aria-current={chat.chat_id === props.selectedChatId ? "page" : undefined} onClick={() => props.onSelect(chat.chat_id)}>
                {chat.title}
                <StatusBadge status={chat.status} />
              </button>
              <Button
                type="button"
                tone="secondary"
                disabled={!props.csrfToken || chat.chat_id !== props.selectedChatId || props.isMutating}
                onClick={() => props.onDelete(chat.chat_id)}
              >
                削除
              </Button>
            </div>
          ))
        )}
      </nav>
    </Sidebar>
  );
}
