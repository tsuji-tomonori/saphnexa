# Admin document version lifecycle boundary

## 背景

`.workspace` の基本設計では FR-DOC-UPD-001/002 として、管理者が既存文書へ新しい文書版を登録し、取り込み完了済みの文書版だけを active に切り替えられることが定義されている。
現行 PR #3 では API contract と local API に `getDocument` / `createDocumentVersion` / `activateDocumentVersion` があるが、Web Admin の文書管理画面から文書版詳細、版追加、active 化を確認する境界は未接続である。

## 目的

Admin Dashboard の文書タブに文書版 lifecycle 確認 UI を追加し、既存 `getDocument` / `createDocumentVersion` / `activateDocumentVersion` API を route helper / generated operation helper 経由で使える状態へ進める。実 PDF upload や Step Functions 実行ではなく、local/source gate 用の文書版追加・active 化境界として確認する。

## タスク種別

機能追加

## スコープ

- `apps/web` に `useDocumentDetail` / `useCreateDocumentVersion` / `useActivateDocumentVersion` hooks を追加する。
- `apps/web` に文書版 lifecycle 操作用の Admin component を追加する。
- Admin Dashboard の文書タブへ文書版 lifecycle component を接続する。
- local store / local API / DSQL repository の文書詳細・版追加・active 化境界を必要範囲で補強する。
- UI/source/web/docs gate を更新する。
- 実 PDF binary upload、S3 raw PDF 配置、Step Functions 取り込み実行、Bedrock KB / S3 Vectors ingestion、文書停止・削除は今回の対象外とする。

## 実装計画

1. 文書詳細・版追加・active 化 hooks を API client generated helper と route helper で実装する。
2. `DocumentVersionLifecyclePanel` を React Hook Form + Zod + shared UI components で実装する。
3. local store/API の `getDocument` が document versions / ACL summary / ingestion jobs を返せるように補強し、active 化は取り込み完了済み版だけ許可する。
4. DSQL repository の `getDocument` / `createDocumentVersion` / `activateDocumentVersion` query plan 境界を確認・補強する。
5. Web/source/UI/docs gate と local verification docs を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin 文書版 lifecycle が `getDocument` / `createDocumentVersion` / `activateDocumentVersion` route helper と local/source gate で確認されること、実 PDF upload / Step Functions 実行 / Bedrock KB ingestion は別途であることを追記する。

## 受け入れ条件

- [x] Admin UI が `getDocument` / `createDocumentVersion` / `activateDocumentVersion` route helper / generated operation helper 経由で文書詳細、版追加、active 化を行う。
- [x] 文書版 lifecycle UI が React Hook Form + Zod と共通 UI components を使い、document_id / version input、empty/error/pending/result state を表示する。
- [x] local store/API が文書詳細に versions / ingestion jobs / ACL summary を返し、active 化は取り込み完了済み版だけ許可する。
- [x] DSQL repository と source/UI/web/docs gate が Admin 文書版 lifecycle 境界を検査する。
- [x] 選定した検証コマンドが pass し、実 PDF upload、S3 raw PDF 配置、Step Functions 実行、Bedrock KB / S3 Vectors ingestion、文書停止・削除を実施済み扱いしない。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck -w @saphnexa/db-types`
- `npm run api:openapi:check`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `npm run test:integration:local`
- `npm run admin:workflow:check`
- `git diff --check`

## 検証結果

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run api:openapi:check`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run typecheck:source`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass
- `npm run test:integration:local`: pass
- `npm run admin:workflow:check`: pass
- `git diff --check`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4571209203
- セルフレビュー結果: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4571209247

## PR レビュー観点

- Web UI が架空の文書版・件数・ACL を表示していないこと。
- `getDocument` / `createDocumentVersion` / `activateDocumentVersion` が API client generated operation helper と route helper を通ること。
- active 化は取り込み成功済み版に限定され、失敗・queued 版を active にできないこと。
- local API と DSQL query plan の admin role / tenant boundary が弱まっていないこと。
- 実 PDF upload / Step Functions / Bedrock KB ingestion を実装済みに見せていないこと。

## リスク

- この slice は local/API 境界であり、実 PDF upload や実取り込み pipeline の完了証跡ではない。
- ACL summary は local state の `document_acl_entries` 由来であり、実 KB metadata snapshot 生成の検証ではない。

## 状態

done
