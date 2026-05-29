# Chat citation REST 復元境界 作業完了レポート

## 受けた指示

- `.workspace` の `plan-20260529.txt` と `Saphnexa_基本設計書_v0.17_package.zip` を前提に、TypeScript framework 実装化の残作業を継続する。
- 作業前に `main` を pull/fetch してから進める。
- リポジトリルールに従い、task md、検証、PR 反映、作業レポートを残す。

## 要件整理

- Chat の citation は `citation_records` と final event payload に存在するが、`listMessages` response には含まれていなかった。
- 履歴再取得時にも Citation Drawer が REST 由来の citation を表示できる必要がある。
- AppSync Events payload に回答本文や chunk 本文を混ぜない制約は維持する。

## 検討・判断

- 新規 endpoint ではなく、既存の message history REST 境界である `listMessages` に message ごとの `citations` array を追加した。
- DSQL plan は participant join で閲覧者境界を維持しつつ、`citation_records` を message 単位に lateral aggregate する方針にした。
- Citation Drawer は REST message history 由来の citation を優先し、event payload 由来 citation と重複排除して表示する形にした。

## 実施作業

- `packages/domain/src/store.js` / `store-types.ts`
  - `listMessages` / `getChat` の message に `citations` を付与した。
  - `CitationRecord.display` を structured object として型付けした。
- `apps/api/src/repositories/dsql/apiRepository.ts`
  - `listMessages` に `citation_records` の lateral aggregate を追加し、`citations` を返す SQL plan にした。
- `apps/api/src/openapi-document.*` / `zod-openapi-schemas.*`
  - `chatMessageSchema` に `citations` array を追加した。
- `packages/api-client/src/generated/operation-types.ts`
  - generated operation type を再生成し、`listMessages` / `getChatSession` message に `citations` を反映した。
- `apps/web/src/features/chat/CitationDrawerPanel.tsx`
  - REST message history と event payload の citation を統合し、`citation_id` で重複排除するようにした。
- `apps/web/src/features/chat/MessageHistoryPanel.tsx`
  - citation REST 復元を接続済み表示にし、message ごとの citation count を表示するようにした。
- `tests/integration-local.test.js` / `tools/check-web-flows.js`
  - REST message history で citation が復元されること、outsider が取得できないこと、feedback state と citation が共存することを確認した。
- `docs/ops/local-verification.md`
  - Chat message history の local gate を citation records 復元済みに同期した。

## 成果物

- `tasks/do/20260529-1953-chat-citation-rest-restore.md`
- `reports/working/20260529-1953-chat-citation-rest-restore.md`
- PR #3 へ反映予定の実装差分

## 検証

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck:source`: pass
- `npm run api-client:operation-types:check`: pass
- `npm run api:openapi:check`: pass
- `npm run web:flow:check`: pass
- `npm run ui:check`: pass
- `npm run web:a11y:check`: pass
- `npm run test:integration:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass with existing Vite 500 kB chunk warning
- `git diff --check`: pass

## 指示への fit 評価

- `plan-20260529.txt` の TypeScript framework 実装化に向けた Chat UI/API 境界の未接続項目を 1 つ接続済みに近づけた。
- `main` は作業前に `git fetch origin main` で確認し、`origin/main...HEAD` は `0 120` だった。
- 実施していない外部検証は実施済み扱いにしていない。

## 未対応・制約・リスク

- 実 Aurora DSQL での SQL 実行は未実施。
- 実 AppSync Events subscribe と実ブラウザ E2E は未実施。
- citation detail 専用 endpoint と citation full text/chunk body の復元は対象外。今回の REST 復元は既存 `citation_records.display` metadata の復元である。
