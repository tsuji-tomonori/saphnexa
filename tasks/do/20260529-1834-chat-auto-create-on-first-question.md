# Chat 初回質問送信時の自動チャット作成境界

- 状態: do
- タスク種別: 機能追加
- 作成日時: 2026-05-29 18:34
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Chat UI は `/chat/:chat_id` の選択境界まで接続済みだが、チャットがまだ存在しない状態で質問を送信した場合の自動 chat 作成は未接続として残っている。基本設計の Chat UI は初回質問から会話を開始できる必要があるため、UI の初回送信フローを実 chat 作成 API と既存質問送信 API へ接続する。

## 目的

チャット未作成状態でユーザーが質問を送信した場合に、質問文から初期タイトルを作成して chat を作成し、その chat を選択・URL 反映したうえで既存の assistant 質問送信フローを継続する。

## スコープ

- `ChatPage` の submit フロー
- Chat UI / flow / a11y source gate の期待値
- ローカル検証 docs の未接続項目表現

## 対象外

- chat event append の永続追記
- 実 AppSync Events fan-out
- ブラウザ E2E の実行
- backend API の追加

## 実施計画

1. `ChatPage` の submit で `activeChatId` がない場合に `createChatSession` を呼び出す。
2. 作成された chat を `selectChat` で選択し、`/chat/<chat_id>` へ URL を更新する。
3. 作成された chat id で `submitAssistantQuestion` と WS ticket 発行を継続する。
4. UI 表示と source gate を、初回自動作成は接続済み、chat event append は未接続として整合させる。
5. 選定した検証コマンドを実行する。

## ドキュメント保守計画

`docs/ops/local-verification.md` の Chat UI 境界説明を更新し、初回質問送信時の自動 chat 作成は source gate 対象として記載する。未接続の event append / SQS / browser E2E は満たした扱いにしない。

## 受け入れ条件

- [ ] チャット未作成状態で質問送信した場合、質問文由来のタイトルで `createChatSession` が呼ばれる。
- [ ] 作成された chat が選択され、URL が `/chat/<chat_id>` に更新される。
- [ ] 作成された chat id で `submitAssistantQuestion`、message id 更新、WS ticket 発行、channels 更新が継続される。
- [ ] UI/source gate/docs 上で「初回質問送信時の自動チャット作成」は接続済み範囲になり、`chat event append` は未接続として残る。
- [ ] 選定した検証コマンドが pass する。

## 検証計画

- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run docs:check`
- `npm run web:build:check`
- `git diff --check`

## PR セルフレビュー観点

- 初回自動作成の実装が既存チャット選択・削除フローを壊していないこと。
- 未接続の chat event append / browser E2E を実装済み扱いにしていないこと。
- 固定の架空チャットや demo fallback を本番 UI に混ぜていないこと。
- docs と source gate の主張が実装範囲と一致していること。

## リスク

- API 実行環境がないため、ブラウザからの実 API 結合はこの slice では未検証。
- chat 作成後の event append 永続化は対象外であり、別 task で接続が必要。
