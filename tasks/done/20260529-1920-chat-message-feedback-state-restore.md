# Chat メッセージ履歴 feedback state 復元境界

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 19:20
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Chat メッセージ履歴は `listMessages` でユーザー質問と assistant 回答を再表示できるが、回答に対して登録済みの feedback state は履歴レスポンスと UI へ復元されていない。基本設計の Chat UI では回答の評価状態を再確認できる必要があるため、閲覧者本人の feedback だけを message に紐づけて返す境界を追加する。

## 目的

`listMessages` の各 message に、閲覧者本人が登録した feedback state を任意フィールドとして付与し、Message history UI で rating と comment を表示する。別ユーザーの feedback は返さず、未接続表示から `feedback state` を外す。

## スコープ

- local store `listMessages`
- DSQL repository `listMessages` plan
- Chat message response schema / API client generated types
- Web `ChatMessage` 型と `MessageHistoryPanel`
- source/local/API/docs gates

## 対象外

- paging cursor
- 引用本文の完全 REST 復元
- feedback 一覧 API
- feedback 取消
- 実 Aurora DSQL SQL 実行
- 実ブラウザ E2E

## 実施計画

1. Chat message 型に `feedback` 任意フィールドを追加する。
2. local store の `listMessages` で actor user の `message_feedback` だけを message に付与する。
3. DSQL `listMessages` plan に actor user の `message_feedback` left join と JSON field を追加する。
4. OpenAPI/Zod schema と generated operation types を同期する。
5. Message history UI に feedback 表示を追加し、未接続表示を `paging cursor、引用本文の完全 REST 復元` に更新する。
6. source/local/API/docs gates と検証を更新する。

## ドキュメント保守計画

`docs/ops/local-verification.md` の Chat message history 境界から `feedback state 復元` を接続済み範囲へ移し、paging cursor と citation 本文の完全 REST 復元は未接続として残す。

## 受け入れ条件

- [x] `listMessages` が message ごとに閲覧者本人の feedback state を `feedback` として返す。
- [x] 他ユーザーの feedback rating/comment が `listMessages` で漏えいしない。
- [x] DSQL `listMessages` plan が actor user の `message_feedback` だけを left join する。
- [x] Web Message history が feedback rating/comment を表示する。
- [x] UI/source gate/docs 上で `feedback state` は接続済み範囲になり、paging cursor と引用本文の完全 REST 復元は未接続として残る。
- [x] 選定した検証コマンドが pass する。

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

- `feedback` は actor 本人のものだけを返し、共有チャットの他参加者 feedback を漏らしていないこと。
- API schema / generated client type / Web type が同期していること。
- 未接続の paging cursor、引用本文完全復元、実ブラウザ E2E を実装済み扱いにしていないこと。
- benchmark 期待語句や dataset 固有分岐を実装へ入れていないこと。

## リスク

- 実 Aurora DSQL 上の SQL 実行は未検証であり、local/source gate の範囲で確認する。
- feedback 一覧・取消・分析集計は別 task として残る。
