# Chat session audit event append 境界 作業完了レポート

## 受けた指示

- `.workspace` の `plan-20260529.txt` と `Saphnexa_基本設計書_v0.17_package.zip` を前提に、TypeScript framework 実装化の残作業を継続する。
- 作業前に `main` を pull/fetch してから進める。
- リポジトリルールに従い、task md、検証、PR 反映、作業レポートを残す。

## 要件整理

- Chat session の作成、タイトル更新、削除は接続済みだが、UI/docs 上の `chat event append` が未接続として残っていた。
- 既存 schema では `chat_message_events` は message/run 単位の stream であるため、session lifecycle は `audit_events` に記録する。
- SQS/AppSync publish、保持期間後の物理削除、実 Aurora DSQL SQL 実行、実ブラウザ E2E は未接続として残す。

## 検討・判断

- `chat_message_events` に session lifecycle を混在させると `message_id` 必須の table 意味を壊すため、既存 `audit_events` に `chat.session.*` を append する方針にした。
- local store と DSQL source plan の両方で create/update/delete と audit insert を同じ操作境界に置いた。
- UI 表示は「chat session audit event append: 接続済み」とし、未接続事項は保持期間後物理削除と SQS/AppSync publish に絞った。

## 実施作業

- `packages/domain/src/store.js`
  - `createChat` が `chat.session.created` audit event を追記するようにした。
  - `updateChat` が `chat.session.title_updated` audit event を追記するようにした。
  - `deleteChat` が `chat.session.deleted` audit event を追記し、`physical_delete: false` を明示するようにした。
- `apps/api/src/repositories/dsql/apiRepository.ts`
  - `createChatSession` / `updateChatSession` / `deleteChatSession` の CTE plan に `audit_events` insert を追加した。
- `apps/web/src/features/chat/ChatSessionNav.tsx`
  - session audit event append を接続済み表示へ更新した。
  - 保持期間後物理削除と SQS/AppSync publish は未接続表示として残した。
- `tests/integration-local.test.js` / `tools/check-web-flows.js`
  - lifecycle audit event 追記と失敗操作で audit event が増えないことを確認する assertion を追加した。
- `tools/check-type-surface.js` / `tools/check-ui-quality.js` / `tools/check-web-accessibility-report.js` / `tools/check-admin-workflows.js`
  - DSQL source、UI 表示、audit category の gate を更新した。
- `docs/ops/local-verification.md`
  - Chat session lifecycle の検証範囲を `audit_events` 追記へ同期した。

## 成果物

- `tasks/do/20260529-1944-chat-session-audit-event-append.md`
- `reports/working/20260529-1944-chat-session-audit-event-append.md`
- PR #3 へ反映予定の実装差分

## 検証

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck:source`: pass
- `npm run web:flow:check`: pass
- `npm run ui:check`: pass
- `npm run web:a11y:check`: pass
- `npm run test:integration:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run docs:check`: pass
- `npm run admin:workflow:check`: pass
- `git diff --check`: pass

## 指示への fit 評価

- `plan-20260529.txt` の TypeScript framework 実装化に向けた Chat UI/API 境界の未接続項目を 1 つ接続済みに近づけた。
- `main` は作業前に `git fetch origin main` で確認し、`origin/main...HEAD` は `0 118` だった。
- 実施していない外部検証は実施済み扱いにしていない。

## 未対応・制約・リスク

- 実 Aurora DSQL での SQL 実行は未実施。
- SQS/AppSync publish、保持期間後の物理削除、実ブラウザ E2E は未接続。
- `audit_events` は local/source gate で確認しており、外部 AWS リソース上の実 audit sink では未確認。
