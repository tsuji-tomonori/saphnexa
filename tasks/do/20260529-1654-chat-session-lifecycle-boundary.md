# Chat session lifecycle boundary

## 背景

`.workspace` の基本設計では FR-HIST-003 / API-8〜9 として、owner がチャットのタイトル等を更新し、自分が owner であるチャットを削除できることが定義されている。
現行 PR #3 では `updateChatSession` / `deleteChatSession` の API contract / route helper / OpenAPI schema は存在するが、local API dispatch、DSQL query plan、Web Chat UI からの操作境界はまだ未接続である。

## 目的

Chat UI から owner が現在のチャットタイトルを更新し、チャットを削除できる API/UI 境界を追加する。local/source gate では owner だけが対象チャットを更新・削除でき、viewer / outsider は拒否され、削除後のチャットが一覧から消えることを確認する。

## タスク種別

機能追加

## スコープ

- `packages/domain` local store と `apps/api` local API に `updateChat` / `deleteChat` を追加する。
- DSQL repository に `updateChatSession` / `deleteChatSession` query plan を追加する。
- Web Chat sidebar にタイトル更新フォームと削除操作を追加する。
- source/UI/web/docs/local flow gate を更新する。
- chat event table への完全な append-only lifecycle 記録、保持期間後の物理削除、実ブラウザ E2E、実 Aurora DSQL 実行は今回の対象外とする。

## 実装計画

1. local store に `updateChat` / `deleteChat` を追加し、`requireOwner` で owner 境界を確認する。
2. local API に `updateChatSession` / `deleteChatSession` dispatch を追加する。
3. DSQL repository に active owner 限定の title 更新 / logical delete plan を追加する。
4. Web hook と Chat sidebar controls を追加し、mutation 後に chat sessions query を invalidate する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Chat session lifecycle は route helper / generated operation helper と local/source gate で確認し、chat event table への完全 append-only 記録、保持期間後物理削除、実ブラウザ E2E は別途であることを追記する。

## 受け入れ条件

- [x] Web Chat が `updateChatSession` / `deleteChatSession` route helper / generated operation helper を使う。
- [x] owner だけが対象チャットのタイトル更新・削除を実行でき、viewer / outsider を拒否する。
- [x] 削除後のチャットが `listChatSessions` と `getChatSession` の通常取得から除外される。
- [x] DSQL repository が `chat_sessions` table を owner 境界付きで更新・削除する。
- [x] UI/source/docs/local flow gate が Chat session lifecycle 境界を検査する。
- [x] 選定した検証コマンドが pass し、chat event table の完全 append-only 記録、保持期間後物理削除、実ブラウザ E2E を実施済みに見せない。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run api-client:operation-types:check`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `npm run test:integration:local`
- `npm run test:contract`
- `npm test`
- `git diff --check`

## PR レビュー観点

- 更新・削除が owner 境界を越えていないこと。
- Web が固定 chat ID や fake title を本番 fallback として表示せず、入力値と API response / query state 由来で操作すること。
- chat event table への完全 append-only lifecycle 記録や保持期間後物理削除を実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実ブラウザ操作や CloudFront/Cognito 経由 HTTP の証跡ではない。
- local store は既存の status/deleted_at 表現に合わせ、設計上の完全な event-sourced lifecycle 正本化は別途とする。

## 実施結果

- local store / local API に `updateChat` / `deleteChat` と `updateChatSession` / `deleteChatSession` dispatch を追加した。
- DSQL repository に active owner participant 境界付きの title 更新 / logical delete query plan を追加した。
- Web Chat sidebar に React Hook Form + Zod のタイトル更新フォームと削除操作を追加し、mutation 後の chat 関連 query invalidate を追加した。
- `docs/ops/local-verification.md`、UI/source/a11y/type/local flow gate に lifecycle 境界を追加した。

## 検証結果

- pass: `npm run typecheck -w @saphnexa/api`
- pass: `npm run typecheck -w @saphnexa/web`
- pass: `npm run api-client:operation-types:check`
- pass: `npm run ui:check`
- pass: `npm run web:flow:check`
- pass: `npm run web:a11y:check`
- pass: `npm run typecheck:source`
- pass: `npm run docs:check`
- pass: `npm run web:build:check`
- pass: `npm run test:integration:local`
- pass: `npm run test:contract`
- pass: `npm test`
- pass: `git diff --check`

## 状態

in_progress
