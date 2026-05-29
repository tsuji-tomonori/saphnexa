# Chat session audit event append 境界

- 状態: do
- タスク種別: 機能追加
- 作成日時: 2026-05-29 19:44
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Chat session の作成、タイトル更新、削除は local/API/Web 境界が接続済みだが、UI/docs では `chat event append` が未接続として残っている。既存 schema では `chat_message_events` は message 単位の run/event 用であり、chat session lifecycle は `audit_events` に記録するのが自然である。

## 目的

Chat session 作成、タイトル更新、削除を append-only な `audit_events` に記録し、local/source gate と docs/UI 表示で「chat session audit event append」は接続済みとして扱えるようにする。保持期間後の物理削除や実 AppSync/SQS publish は未接続として残す。

## スコープ

- local store `createChat` / `updateChat` / `deleteChat`
- DSQL repository `createChatSession` / `updateChatSession` / `deleteChatSession` query plan
- Web `ChatSessionNav` の正直な接続状態表示
- source/local/docs gates

## 対象外

- `chat_message_events` への session lifecycle 混在
- SQS event-publish / AppSync fan-out
- 保持期間後の物理削除
- 実 Aurora DSQL SQL 実行
- 実ブラウザ E2E

## 受け入れ条件

- [ ] `createChatSession` が `audit_events` に `chat.session.created` を追記する。
- [ ] `updateChatSession` が owner 境界を維持したまま `audit_events` に `chat.session.title_updated` を追記する。
- [ ] `deleteChatSession` が owner 境界と参加者 removed 化を維持したまま `audit_events` に `chat.session.deleted` を追記する。
- [ ] outsider/viewer の失敗操作では lifecycle audit event が追加されない。
- [ ] DSQL plan が lifecycle 操作と `audit_events` insert を同じ CTE plan 内で表現する。
- [ ] UI/source gate/docs で `chat event append` は接続済み範囲になり、保持期間後物理削除・SQS/AppSync publish は未接続として残る。
- [ ] 選定した検証コマンドが pass する。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run test:integration:local`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## PR セルフレビュー観点

- `audit_events` に session lifecycle を寄せ、message event stream の意味を壊していないこと。
- owner/participant 認可境界を弱めていないこと。
- 未実施の SQS/AppSync/Aurora 実行/実ブラウザ E2E を完了扱いにしていないこと。
- benchmark 期待語句や dataset 固有分岐を実装へ入れていないこと。
