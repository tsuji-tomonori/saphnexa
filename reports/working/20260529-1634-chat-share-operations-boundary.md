# Chat share operations boundary 作業完了レポート

## 受けた指示

- `main` を pull/fetch してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に沿って、Chat 共有操作境界を進める。
- Repository Agent Instructions に従い、task md、検証、PR 反映、作業レポートを残す。

## 要件整理

- FR-SHARE-001〜003 / API-11〜13 の owner による viewer 共有、viewer 再有効化、共有解除を Web/API/DSQL 境界に接続する。
- owner だけが共有操作でき、viewer / outsider は共有操作できないことを local flow で確認する。
- owner 移譲、viewer の owner 昇格、実 AppSync Events fan-out、実ブラウザ E2E は今回の対象外として明記する。

## 検討・判断

- local store は既存の `requireOwner` 境界を使い、viewer の再有効化では removed participant を active viewer に戻せるようにした。
- DSQL plan は requester が対象 chat の active owner であることを条件にして、`chat_participants` を追加・viewer 更新・removed 更新する形にした。
- Web UI は固定ユーザーや fake participant を置かず、入力された user_id と API response / query state 由来の値だけを表示・更新する。

## 実施作業

- DSQL repository に `addChatParticipant` / `updateChatParticipant` / `removeChatParticipant` query plan を追加した。
- Web に参加者共有 mutation hook を追加し、参加者一覧とチャット一覧 query を invalidate するようにした。
- `ChatParticipantsPanel` に React Hook Form + Zod の共有フォーム、viewer 再有効化、共有解除操作を追加した。
- source/UI/web/a11y/docs/local flow gate を更新し、owner 境界、viewer / outsider 拒否、owner 昇格拒否、owner 削除拒否を検査するようにした。
- `docs/ops/local-verification.md` に local gate の対象と未完了範囲を追記した。

## 成果物

- `tasks/do/20260529-1634-chat-share-operations-boundary.md`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `apps/web/src/hooks/useChatParticipants.ts`
- `apps/web/src/features/chat/ChatParticipantsPanel.tsx`
- `apps/web/src/pages/ChatPage.tsx`
- `packages/domain/src/store.js`
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
- 基本設計の owner/viewer 共有境界に絞り、owner 移譲や実 AppSync Events fan-out を実施済みとは扱っていない。
- docs と source/local gate に未完了範囲を明記し、実装と検証の範囲を一致させた。

## 未対応・制約・リスク

- 実 Aurora DSQL、Cognito/CloudFront 経由 HTTP、実ブラウザ E2E の証跡は未実施。
- owner 移譲、viewer の owner 昇格、実 AppSync Events fan-out は別 slice の対象。
- PR 作成・コメントは GitHub Apps ではなく `gh` CLI fallback を使う。
