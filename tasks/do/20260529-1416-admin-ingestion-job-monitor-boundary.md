# Admin ingestion job monitor boundary

## 背景

`.workspace` の基本設計では、FR-DOC-002 として管理者が PDF 登録後の取り込みジョブ状態、進捗、失敗理由を確認できることが定義されている。
現行 PR #3 では `getIngestionJob` / `retryIngestionJob` API contract と local API はあるが、Web Admin から取り込みジョブを確認・再実行する UI 境界と source gate が未実装である。

## 目的

Admin Dashboard の文書タブから、既存 `getIngestionJob` / `retryIngestionJob` API を generated operation helper / route helper 経由で使い、取り込みジョブ状態を確認し、retryable な失敗ジョブを再実行できる境界を追加する。

## タスク種別

機能追加

## スコープ

- `apps/web` に `useIngestionJob` hook と `useRetryIngestionJob` hook を追加する。
- `apps/web` に `IngestionJobPanel` を追加し、ジョブ ID 入力、状態表示、失敗理由、raw/parsed path、retry 操作を表示する。
- Admin Dashboard の「文書」タブに `IngestionJobPanel` を追加する。
- DSQL repository に `getIngestionJob` の query plan を追加する。
- UI/source/web/docs gate を更新する。
- 実 Step Functions 実行、実 S3/KB/S3 Vectors ingestion、進捗 percentage、job 一覧 API は今回の対象外とする。

## 実装計画

1. `useIngestionJob` / `useRetryIngestionJob` を API client generated helper と route helper で実装する。
2. `IngestionJobPanel` を React Hook Form + Zod + shared UI components で実装する。
3. Admin Dashboard の文書タブに取り込みジョブ確認 UI を追加する。
4. DSQL repository に `getIngestionJob` query plan を追加する。
5. source/UI/web/docs gate を追加・更新する。
6. Web/API/source/docs/build/local integration/diff check を実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin 取り込みジョブ確認は `getIngestionJob` / `retryIngestionJob` API 境界を source gate で確認すること、実 Step Functions / S3 / KB ingestion は別途であることを追記する。

## 受け入れ条件

- [ ] Admin UI が `getIngestionJob` / `retryIngestionJob` route helper / generated operation helper 経由で取り込みジョブを取得・再実行する。
- [ ] 取り込みジョブ UI が React Hook Form + Zod と共通 UI components を使い、empty/error/pending/status/retryable state を表示する。
- [ ] retry 操作は CSRF token と retryable job がない状態では実行できず、成功後に対象 job query を再取得する。
- [ ] local API / DSQL repository / source/UI/web/docs gate が Admin 取り込みジョブ確認境界を検査する。
- [ ] 選定した検証コマンドが pass し、実 Step Functions / S3 / KB / S3 Vectors ingestion や job 一覧 API を実施済み扱いしない。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `npm run test:integration:local`
- `git diff --check`

## PR レビュー観点

- Web UI が架空 job や固定進捗を表示していないこと。
- `getIngestionJob` / `retryIngestionJob` が API client generated operation helper と route helper を通ること。
- CSRF token または retryable job がない状態では retry 操作できないこと。
- 未実装の Step Functions / S3 / KB / S3 Vectors ingestion や job 一覧 API を実装済みに見せていないこと。

## リスク

- この slice は取り込みジョブ確認 API 境界であり、実 ingestion workflow の実行証跡ではない。
- 現状は job ID 指定での確認であり、文書別・全件の job 一覧 UI は未対応。

## 状態

do
