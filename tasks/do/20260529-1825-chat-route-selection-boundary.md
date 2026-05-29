# Chat route selection 境界

状態: do
タスク種別: 機能追加

## 背景

`plan-20260529.txt` では frontend が scaffold 寄りで、Session Sidebar / Chat UI の routing が未達として扱われていた。現行 PR #3 では Chat session lifecycle、message history、participants などの local/source 境界は進んでいるが、`/chat/:chat_id routing` は UI 上でも未接続表示のままで、`ChatPage` は内部 state のみで選択チャットを保持している。

## 目的

Chat session の選択状態を browser path と同期し、`/chat/:chat_id` から対象 chat を開ける source-level 境界を追加する。

## スコープ

- `apps/web/src/routes.ts`
- `apps/web/src/pages/ChatPage.tsx`
- `apps/web/src/features/chat/ChatSessionNav.tsx`
- `tools/check-web-flows.js`
- `tools/check-ui-quality.js`
- `tools/check-web-accessibility-report.js`
- `docs/ops/local-verification.md`

## 受け入れ条件

- [x] route metadata に `/chat/:chat_id` が `general_user` chat route として存在する。
- [x] `ChatPage` が browser path `/chat/:chat_id` から初期 `selectedChatId` を復元する。
- [x] Chat session 選択時に `/chat/<chat_id>` へ `history.pushState` する。
- [x] 新規 chat 作成後に作成 chat を選択し、`/chat/<chat_id>` へ遷移する。
- [x] 選択 chat 削除時に `/chat` へ戻す。
- [x] `popstate` で browser back/forward と選択 chat が同期する。
- [x] UI の未接続表示から `/chat/:chat_id routing` を外し、未接続事項は初回質問送信時の自動 chat 作成と chat event append に限定する。
- [x] source/UI/a11y/docs gates が route selection 境界を確認する。
- [x] 変更範囲に見合う typecheck、source/UI/a11y/flow/docs/build/diff check が成功する。

## 検証予定

- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run docs:check`
- `npm run web:build:check`
- `git diff --check`

## 検証結果

- `npm run typecheck -w @saphnexa/web`: pass（初回は `match[1]` の undefined 可能性で失敗し、明示 guard に修正後 pass）
- `npm run typecheck:source`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass（Vite の 500 kB chunk warning は継続）
- `git diff --check`: pass

## PR レビュー観点

- URL 同期が本番 UI の架空 state を作らず、API 由来の chat id を選択状態として扱うこと。
- routing 追加が role metadata の `general_user` 境界を弱めていないこと。
- 初回質問送信時の自動 chat 作成や chat event append を実装済み扱いしていないこと。

## リスク

- 実ブラウザ E2E は今回の範囲外。source gate と Vite build による確認に留まる。
