# Chat favorite boundary

## 背景

`.workspace` の基本設計では FR-FAV-001 として、一般ユーザーが参加しているチャットまたは閲覧可能な回答をお気に入り登録・解除できることが定義されている。
現行 PR #3 では `listFavorites` / `addFavorite` / `deleteFavorite` の API contract / route helper は存在するが、Web Chat UI からの操作境界、local API の削除処理、DSQL query plan、DB shared row type 境界はまだ薄い。

## 目的

Chat UI から現在のチャットをお気に入り登録・解除できる API/UI 境界を追加する。実ブラウザ E2E や回答単位のお気に入り UX は対象外とし、local/source gate では参加チャットだけ登録でき、解除後に一覧から消えることを確認する。

## タスク種別

機能追加

## スコープ

- `favorites` table metadata / shared DB row type を追加する。
- `packages/domain` local store と `apps/api` local API に `deleteFavorite` を追加する。
- DSQL repository に `listFavorites` / `addFavorite` / `deleteFavorite` query plan を追加する。
- Web Chat に `useFavorites` / `useAddFavorite` / `useDeleteFavorite` hook とお気に入り操作 panel を追加する。
- source/UI/web/docs/local flow gate を更新する。
- 実ブラウザ E2E、回答単位のお気に入り詳細 UX、CloudFront/Cognito 経由 HTTP 証跡は今回の対象外とする。

## 実装計画

1. DB metadata / db-types に `favorites` row 型を追加し、DSQL repository の `resultTable: "favorites"` を型で扱えるようにする。
2. local store/API に `deleteFavorite` を追加し、本人の favorite だけ削除できるようにする。
3. DSQL repository に参加チャット認可付きの `listFavorites` / `addFavorite` / `deleteFavorite` plan を追加する。
4. Web hook と Chat favorite panel を追加し、`ChatPage` へ接続する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Chat favorite は route helper / generated operation helper と local/source gate で確認し、実ブラウザ E2E と回答単位 UX は別途であることを追記する。

## 受け入れ条件

- [x] Web Chat が `listFavorites` / `addFavorite` / `deleteFavorite` route helper / generated operation helper を使う。
- [x] local store/API が参加チャットだけお気に入り登録でき、本人の favorite だけ解除できる。
- [x] DSQL repository と DB shared row type が `favorites` table を扱う。
- [x] UI/source/docs/local flow gate が Chat favorite 境界を検査する。
- [x] 選定した検証コマンドが pass し、架空 favorite や未接続の実ブラウザ E2E を実施済みに見せない。

## 検証計画

- [x] `npm run typecheck -w @saphnexa/api`
- [x] `npm run typecheck -w @saphnexa/web`
- [x] `npm run typecheck -w @saphnexa/db-types`
- [x] `npm run api-client:operation-types:check`
- [x] `npm run ui:check`
- [x] `npm run web:flow:check`
- [x] `npm run web:a11y:check`
- [x] `npm run typecheck:source`
- [x] `npm run docs:check`
- [x] `npm run web:build:check`
- [x] `npm run test:integration:local`
- [x] `npm run test:contract`
- [x] `npm test`
- [x] `git diff --check`

## 検証結果

2026-05-29 に上記コマンドをすべて実行し pass。`web:build:check` は Vite の 500 kB chunk warning を出したが、既存の build output gate は gzip 145995 bytes で pass。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4571667369
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4571667338

## PR レビュー観点

- favorite 追加が参加チャット境界を越えていないこと。
- favorite 削除が本人の favorite だけに限定されていること。
- Web が API response / mutation state 由来で表示し、固定 favorite や fake count を表示していないこと。
- DB metadata / DSQL query plan が migration の `favorites` table と同期していること。

## リスク

- この slice は local/source gate であり、実ブラウザ操作や CloudFront/Cognito 経由 HTTP の証跡ではない。
- 回答単位のお気に入り UX は route contract 上の `message_id` には対応するが、今回の UI は現在チャット単位の最小境界に留める。

## 状態

done
