# Admin 文書登録 metadata fields 境界 作業レポート

- 作成日時: 2026-05-29 20:48 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3
- 関連 task: `tasks/do/20260529-2048-admin-document-metadata-fields.md`

## 指示

- `main` を pull/fetch してから作業する。
- `.workspace/plan-20260529.txt` と基本設計 v0.17 に基づく TypeScript framework 実装を進める。
- Worktree Task PR Flow、PR self review、post task report、実施していない検証を書かない方針に従う。

## 要件整理

- Admin 文書登録フォームで、文書種別、有効開始日、有効終了日を入力できるようにする。
- Web の `createDocument` request は `metadata.document_type` / `metadata.valid_from` / `metadata.valid_until` を送信する。
- local store は UI からの metadata-only payload を required metadata と merge して保存する。
- 実 PDF upload、ACL 編集、取り込みジョブ詳細、実 S3 / KB ingestion は未接続として残す。

## 実施作業

- 作業前に `git fetch origin main` を実行し、`origin/main...HEAD` が `0 129` であることを確認した。
- `DocumentRegistrationForm` に文書種別、有効開始日、有効終了日の入力欄と必須 validation を追加した。
- `useCreateDocument` で入力値から `metadata` を構築し、空値を送らないようにした。
- local store の default metadata に文書種別と有効期間を追加し、metadata-only payload は default metadata と merge するようにした。
- local integration / web flow / UI quality / a11y source gate に metadata 保存と field 接続の確認を追加した。
- `docs/ops/local-verification.md` を更新し、文書種別と有効期間を接続済みへ移した。

## 成果物

- `apps/web/src/features/admin/DocumentRegistrationForm.tsx`
- `apps/web/src/hooks/useCreateDocument.ts`
- `packages/domain/src/store.js`
- `tests/integration-local.test.js`
- `tools/check-web-flows.js`
- `tools/check-ui-quality.js`
- `tools/check-web-accessibility-report.js`
- `docs/ops/local-verification.md`

## 検証

- PASS: `npm run typecheck -w @saphnexa/web`
- PASS: `npm run typecheck:source`
- PASS: `npm run web:flow:check`
- PASS: `npm run ui:check`
- PASS: `npm run web:a11y:check`
- PASS: `npm run test:integration:local`
- PASS: `npm test`
- PASS: `npm run docs:check`
- PASS: `npm run web:build:check`
- PASS: `git diff --check`

## fit 評価

- 受け入れ条件のうち、文書種別、有効開始日、有効終了日の UI 入力、`metadata` 送信、local store 保存、local/source/UI/a11y/docs gate 更新は満たした。
- UI には固定日付や架空 metadata の fallback を入れず、ユーザー入力を API request に渡す形にした。
- 既存の `createDocument` route helper / generated operation helper を使い、新規 public route は追加していない。

## 未対応・制約・リスク

- 実 PDF upload、ACL 編集、取り込みジョブ詳細 UI、実 S3 / KB ingestion、実 Aurora DSQL SQL 実行、実ブラウザ E2E は今回の対象外。
- GitHub Apps による PR top-level comment は既存 PR で 403 となるため、PR コメントは `gh` fallback を使う。
