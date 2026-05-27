import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../../../packages/api-client/src/client";
import { Button, Panel, StatusBadge } from "../../../../packages/ui/src/components";

type Chat = { chat_id: string; title: string; status: string };
type EventRow = { event_seq: number; event_name: string; event_type: string; payload_json: Record<string, unknown> };

export function ChatApp() {
  const [csrfToken, setCsrfToken] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    void apiGet<{ user: unknown; csrf_token: string }>("/api/me").then((me) => setCsrfToken(me.csrf_token));
    void apiGet<{ chats: Chat[] }>("/api/chat-sessions").then((data) => setChats(data.chats));
  }, []);

  async function submit(chatId: string) {
    const accepted = await apiPost<{ message_id: string }>("/api/chat-sessions/" + chatId + "/messages", { question }, csrfToken);
    const detail = await apiGet<{ events: EventRow[] }>("/api/chat-sessions/" + chatId + "/messages/" + accepted.message_id + "/events");
    setEvents(detail.events);
  }

  return (
    <main className="sx-chat-shell">
      <nav aria-label="チャット一覧">
        {chats.map((chat) => (
          <button key={chat.chat_id} type="button">{chat.title}<StatusBadge status={chat.status} /></button>
        ))}
      </nav>
      <Panel aria-label="質問入力">
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="質問" />
        <Button onClick={() => chats[0] && submit(chats[0].chat_id)} disabled={!csrfToken || !question}>送信</Button>
      </Panel>
      <Panel aria-label="イベント">
        {events.map((event) => <div key={event.event_seq}>{event.event_name}</div>)}
      </Panel>
    </main>
  );
}
