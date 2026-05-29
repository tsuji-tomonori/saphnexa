# Chat メッセージ履歴 paging cursor 境界

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 19:30
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Chat メッセージ履歴はユーザー質問、assistant 回答、閲覧者本人の feedback state を再表示できるようになったが、paging cursor は未接続として残っている。長いチャット履歴を扱うには、`listMessages` が cursor と limit を受け取り、次ページの cursor を返す境界が必要である。

## 目的

`listMessages` に `after_message_id` / `limit` query 境界と `next_cursor` response を追加し、local/API/DSQL/source gate で cursor pagination を確認する。Web UI では返却された `next_cursor` を正直に表示し、未接続表示から `paging cursor` を外す。

## スコープ

- local store `listMessages`
- local API `listMessages`
- DSQL repository `listMessages` plan
- OpenAPI schema / generated API client query and response type
- Web `useChatMessages` / `MessageHistoryPanel`
- source/local/API/docs gates

## 対象外

- infinite scroll / full pagination UX
- 引用本文の完全 REST 復元
- 実 Aurora DSQL SQL 実行
- 実ブラウザ E2E

## 実施計画

1. local store `listMessages` が `after_message_id` と `limit` を受け取り、`messages` と `next_cursor` を返すようにする。
2. DSQL `listMessages` plan に cursor 条件、limit、`next_cursor` 判定に必要な `limit + 1` 取得を追加する。
3. OpenAPI schema と generated API client type に `next_cursor` と query type を追加する。
4. Web hook が limit を指定して `next_cursor` を保持し、Message history UI で次ページ cursor を表示する。
5. `paging cursor` を未接続表示から外し、docs/source gates/tests を更新する。

## ドキュメント保守計画

`docs/ops/local-verification.md` の Chat message history 境界から `paging cursor` を接続済み範囲へ移す。引用本文の完全 REST 復元と実ブラウザ E2E は未接続として残す。

## 受け入れ条件

- [x] `listMessages` が `limit` 件を返し、続きがある場合に `next_cursor` を返す。
- [x] `after_message_id` 指定時、指定 message より後の message だけを返す。
- [x] 参加者境界は維持され、未参加者は paging 付きでも message を取得できない。
- [x] DSQL `listMessages` plan が actor 参加者境界と cursor 条件を併用する。
- [x] Web Message history が `next_cursor` を表示する。
- [x] UI/source gate/docs 上で `paging cursor` は接続済み範囲になり、引用本文の完全 REST 復元は未接続として残る。
- [x] 選定した検証コマンドが pass する。

## 完了メモ

- `listMessages` に `limit` / `after_message_id` query と `next_cursor` response を追加した。
- DSQL plan は actor の active participant join と cursor 条件を併用し、`limit + 1` で続き有無を判定する。
- Web message history は page limit 50 で取得し、返却された `next_cursor` を表示する。
- `paging cursor` は接続済み範囲へ移し、引用本文の完全 REST 復元、実 Aurora DSQL SQL 実行、実ブラウザ E2E は未接続として残した。
- PR #3 に受け入れ条件確認コメントとセルフレビューコメントを投稿した。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run api-client:operation-types:check`
- `npm run api:openapi:check`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run test:integration:local`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `npm run web:build:check`
- `git diff --check`

## PR セルフレビュー観点

- paging cursor が actor 参加者境界を迂回していないこと。
- query/response schema、generated client type、Web type が同期していること。
- 未接続の引用本文完全復元、実ブラウザ E2E を実装済み扱いにしていないこと。
- benchmark 期待語句や dataset 固有分岐を実装へ入れていないこと。

## リスク

- 実 Aurora DSQL 上の SQL 実行は未検証であり、source/local gate の範囲で確認する。
- UI は `next_cursor` 表示までで、実際の次ページ取得操作 UX は後続 task として残る。
