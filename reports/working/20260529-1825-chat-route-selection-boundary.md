# Chat route selection 境界 作業レポート

## 受けた指示

- `main` を pull/fetch してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に基づき、TypeScript framework / API / Web UI の未接続境界を前進させる。
- リポジトリルールに従い、task md、検証、PR 更新、作業レポートを残す。

## 要件整理

- Chat session 選択状態を `/chat/:chat_id` route と同期する。
- URL から初期 chat selection を復元する。
- session 選択、新規作成、削除、browser back/forward と選択 state を同期する。
- UI の未接続表示から `/chat/:chat_id routing` を外し、未接続事項を正直に維持する。

## 検討・判断

- 既存アプリは軽量な route metadata と browser history を使う構成なので、React Router 等の新規依存は追加しなかった。
- `ChatPage` 内に `chatIdFromPath` / `writeChatPath` を置き、既存の `selectedChatId` state と最小範囲で接続した。
- 実ブラウザ E2E は未実施だが、source gate、typecheck、Vite build で route selection 境界を確認した。

## 実施作業

- `apps/web/src/routes.ts` に `/chat/:chat_id` route metadata を追加。
- `apps/web/src/pages/ChatPage.tsx` で path から初期 `selectedChatId` を復元。
- chat 選択と新規 chat 作成後に `history.pushState` で `/chat/<chat_id>` へ同期。
- 選択 chat 削除時に `/chat` へ戻し、`messageId` を clear。
- `popstate` で browser back/forward と選択 chat を同期。
- `ChatSessionNav` の未接続表示から `/chat/:chat_id routing` を削除。
- source/UI/a11y/docs gates を更新。

## 成果物

- `apps/web/src/routes.ts`
- `apps/web/src/pages/ChatPage.tsx`
- `apps/web/src/features/chat/ChatSessionNav.tsx`
- `tools/check-web-flows.js`
- `tools/check-ui-quality.js`
- `tools/check-web-accessibility-report.js`
- `tools/check-type-surface.js`
- `docs/ops/local-verification.md`
- `tasks/do/20260529-1825-chat-route-selection-boundary.md`

## 検証

- `npm run typecheck -w @saphnexa/web`: pass（初回は `match[1]` の undefined 可能性で失敗し、明示 guard に修正後 pass）
- `npm run typecheck:source`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass（Vite の 500 kB chunk warning は継続）
- `git diff --check`: pass

## fit 評価

- 総合fit: 4.6 / 5.0
- 理由: `/chat/:chat_id` route metadata と ChatPage state 同期を追加し、計画上の routing 未接続を一段進めた。実ブラウザ E2E と CloudFront rewrite の実挙動確認は未実施のため満点ではない。

## 未対応・制約・リスク

- 実ブラウザ back/forward 操作の E2E は未実施。
- CloudFront / SPA rewrite で `/chat/:chat_id` が実配信されることは未検証。
- 初回質問送信時の自動 chat 作成、chat event table append、SQS event-publish は未接続のまま。
