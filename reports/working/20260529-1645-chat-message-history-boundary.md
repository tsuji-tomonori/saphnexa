# Chat message history boundary 作業完了レポート

## 受けた指示

- `main` を pull/fetch してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に沿って、Chat message history 境界を進める。
- Repository Agent Instructions に従い、task md、検証、PR 反映、作業レポートを残す。

## 要件整理

- FR-U-002 / FR-HIST-002 / API-14 の既存チャット再開時メッセージ再表示を Web/API/DSQL 境界に接続する。
- 参加者だけが対象チャットのメッセージ一覧を取得でき、未参加者は拒否されることを local flow で確認する。
- paging cursor、feedback state 復元、引用本文の完全 REST 復元、実ブラウザ E2E、実 Aurora DSQL 実行は今回の対象外として明記する。

## 検討・判断

- local store は既存の `requireReader` 境界を使い、owner/viewer の参加者だけが chat_messages を時系列で取得できる形にした。
- DSQL plan は `chat_messages` と active `chat_participants` を join し、requester が対象 chat の参加者であることを条件にした。
- Web UI は固定メッセージや fake history を置かず、generated operation helper と query state 由来の値だけを表示する。

## 実施作業

- `packages/domain` に `listMessages` を追加し、local API の `listMessages` dispatch を接続した。
- DSQL repository に `listMessages` query plan と mapper を追加した。
- Web に `useChatMessages` hook と `MessageHistoryPanel` を追加し、`ChatPage` の active chat に接続した。
- source/UI/web/a11y/docs/local flow gate を更新し、メッセージ一覧取得と未参加者拒否を検査するようにした。
- `docs/ops/local-verification.md` に local gate の対象と未完了範囲を追記した。

## 成果物

- `tasks/do/20260529-1645-chat-message-history-boundary.md`
- `apps/web/src/hooks/useChatMessages.ts`
- `apps/web/src/features/chat/MessageHistoryPanel.tsx`
- `packages/domain/src/store.js`
- `packages/domain/src/store-types.ts`
- `apps/api/src/local-api.js`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `docs/ops/local-verification.md`

## 検証

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

## fit 評価

- `main` fetch と差分確認後に専用 worktree branch で作業し、元 worktree の変更は混ぜていない。
- 既存チャット再開時のメッセージ再表示境界に絞り、paging cursor や feedback state 復元を実施済みとは扱っていない。
- docs と local/source gate に未完了範囲を明記し、実装と検証の範囲を一致させた。

## 未対応・制約・リスク

- 実 Aurora DSQL、Cognito/CloudFront 経由 HTTP、実ブラウザ E2E の証跡は未実施。
- paging cursor、feedback state 復元、引用本文の完全 REST 復元は別 slice の対象。
- PR 作成・コメントは GitHub Apps ではなく `gh` CLI fallback を使う。
