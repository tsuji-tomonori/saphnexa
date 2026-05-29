import { Sidebar, StatusBadge } from "@saphnexa/ui";
import type { Chat } from "../../types";

export function ChatSessionNav(props: { chats: Chat[]; selectedChatId: string | null; onSelect: (chatId: string) => void }) {
  return (
    <Sidebar aria-label="チャット一覧">
      <nav aria-label="チャット一覧">
        {props.chats.length === 0 ? (
          <p role="status">チャットはありません</p>
        ) : (
          props.chats.map((chat) => (
            <button key={chat.chat_id} type="button" aria-current={chat.chat_id === props.selectedChatId ? "page" : undefined} onClick={() => props.onSelect(chat.chat_id)}>
              {chat.title}
              <StatusBadge status={chat.status} />
            </button>
          ))
        )}
      </nav>
    </Sidebar>
  );
}
