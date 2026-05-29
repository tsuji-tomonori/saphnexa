import { Button, DataTable, Panel } from "@saphnexa/ui";
import type { Favorite } from "../../types";

export function FavoritePanel(props: {
  activeChatId: string | null;
  csrfToken: string;
  favorites: Favorite[];
  isLoading: boolean;
  isMutating: boolean;
  onAdd: (chatId: string) => void;
  onDelete: (favoriteId: string) => void;
}) {
  const activeFavorite = props.favorites.find((favorite) => favorite.chat_id === props.activeChatId && !favorite.message_id);
  return (
    <Panel aria-label="お気に入り">
      {props.isLoading ? <p role="status">お気に入りを確認しています</p> : null}
      <Button
        type="button"
        disabled={!props.csrfToken || !props.activeChatId || props.isMutating}
        onClick={() => {
          if (activeFavorite) {
            props.onDelete(activeFavorite.favorite_id);
          } else if (props.activeChatId) {
            props.onAdd(props.activeChatId);
          }
        }}
      >
        {activeFavorite ? "お気に入り解除" : "お気に入り登録"}
      </Button>
      <DataTable
        caption="お気に入り一覧"
        empty="お気に入りはありません"
        rows={props.favorites.map((favorite) => ({ ...favorite, id: favorite.favorite_id }))}
        columns={[
          { key: "chat_id", header: "チャットID", render: (favorite) => favorite.chat_id ?? "未設定" },
          { key: "message_id", header: "メッセージID", render: (favorite) => favorite.message_id ?? "チャット" },
          { key: "created_at", header: "登録日時", render: (favorite) => favorite.created_at }
        ]}
      />
    </Panel>
  );
}
