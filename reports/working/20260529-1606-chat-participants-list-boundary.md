# Chat participants list boundary 作業完了レポート

## 受けた指示

- `main` を pull/fetch してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に沿って、Chat participants list 境界を進める。
- Repository Agent Instructions に従い、task md、検証、PR 反映、作業レポートを残す。

## 要件整理

- FR-HIST-004 / API-10 の参加者一覧確認を Chat UI と local/API/DSQL 境界に接続する。
- 参加者だけが対象チャットの参加者一覧を取得でき、未参加者は拒否されることを local flow で確認する。
- 共有操作 UI、ロール変更 UI、実ブラウザ E2E、実 Aurora DSQL 実行は今回の対象外として明記する。

## 検討・判断

- local store は既存の `requireReader` 境界を使い、チャット参加者だけが active participant 一覧を取得できる形にした。
- DSQL plan は requester と target participant を同一 tenant/chat で join し、requester が active participant であることを条件にした。
- Web UI は固定ユーザーや mock participant を置かず、generated operation helper と query state 由来の値だけを表示する。

## 実施作業

- `packages/domain` に `listParticipants` を追加し、local API の `listChatParticipants` dispatch を接続した。
- DSQL repository に `listChatParticipants` query plan と mapper を追加した。
- Web に `useChatParticipants` hook と `ChatParticipantsPanel` を追加し、`ChatPage` の active chat に接続した。
- source/UI/web/a11y/docs/local flow gate を更新し、参加者一覧取得と未参加者拒否を検査するようにした。
- `docs/ops/local-verification.md` に local gate の対象と未完了範囲を追記した。

## 成果物

- `tasks/do/20260529-1606-chat-participants-list-boundary.md`
- `apps/web/src/hooks/useChatParticipants.ts`
- `apps/web/src/features/chat/ChatParticipantsPanel.tsx`
- `packages/domain/src/store.js`
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
- 参加者一覧表示境界に絞り、共有操作 UI や実ブラウザ E2E を実施済みとは扱っていない。
- docs と local/source gate に未完了範囲を明記し、実装と検証の範囲を一致させた。

## 未対応・制約・リスク

- 実 Aurora DSQL、Cognito/CloudFront 経由 HTTP、実ブラウザ E2E の証跡は未実施。
- 参加者追加、削除、ロール変更 UI は別 slice の対象。
- PR 作成・コメントは GitHub Apps ではなく `gh` CLI fallback を使う。
