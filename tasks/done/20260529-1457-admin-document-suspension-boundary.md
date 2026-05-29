# Admin document suspension boundary

## 背景

`.workspace` の基本設計では FR-A-005 / FR-DOC-UPD-003 として、管理者が文書を公開停止でき、公開停止された文書は即時に一般ユーザーの回答対象から除外されることが定義されている。
現行 PR #3 では文書登録、一覧、文書版 lifecycle は Web/API 境界へ接続済みだが、文書停止・削除は未実装として PR 本文と `docs/ops/local-verification.md` に残っている。

## 目的

Admin 文書管理から文書を公開停止できる API/UI 境界を追加する。物理削除は実行せず、local/source gate では `documents.status=deleted` と文書版 `deleted` による検索対象外化境界を確認する。

## タスク種別

機能追加

## スコープ

- `packages/api-contract` / `packages/api-client` に文書公開停止 API route/helper を追加する。
- `apps/api` の OpenAPI/Zod schema、local API、DSQL repository query plan に文書公開停止境界を追加する。
- `packages/domain` local store に admin-only 文書公開停止操作を追加する。
- Admin 文書 lifecycle UI に公開停止操作を追加する。
- source/UI/web/docs/admin workflow gate を更新する。
- 物理削除、S3 object delete、Bedrock KB / S3 Vectors delete、保持期間後 lifecycle 実行は今回の対象外とする。

## 実装計画

1. API route `suspendDocument` を `POST /api/admin/documents/{document_id}/suspend` として追加する。
2. OpenAPI/Zod/client generated 型と route helper を更新する。
3. local store/API で admin role / tenant boundary を維持して `documents.status=deleted`、対象 `document_versions.status=deleted` に更新する。
4. DSQL repository に admin role / tenant boundary 付きの logical delete query plan を追加する。
5. Admin UI の文書版 lifecycle panel に公開停止ボタンと結果 state を追加する。
6. source/UI/web/docs/admin workflow gates と local verification docs を更新する。
7. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin 文書公開停止は logical delete 境界として `suspendDocument` route helper と local/source gate で確認し、物理削除や S3/KB/S3 Vectors 削除は別途であることを追記する。

## 受け入れ条件

- [x] API contract / API client に `suspendDocument` が追加され、CSRF 必須の admin-only route になる。
- [x] local store/API が管理者だけに文書公開停止を許可し、対象文書と文書版を回答対象外の状態へ更新する。
- [x] Admin UI が `suspendDocument` route helper / generated operation helper 経由で公開停止し、実物理削除を実施済みに見せない。
- [x] DSQL repository と source/UI/web/docs/admin workflow gate が文書公開停止境界を検査する。
- [x] 選定した検証コマンドが pass し、S3 object delete、Bedrock KB / S3 Vectors delete、保持期間後 lifecycle 実行を実施済み扱いしない。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck -w @saphnexa/db-types`
- `npm run api-client:operation-types:check`
- `npm run api:openapi:check`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `npm run test:integration:local`
- `npm run admin:workflow:check`
- `npm run test:contract`
- `npm test`
- `npm run acceptance:source:check`
- `npm run aws:dev-uat:preflight-raw-input:fixture:check`
- `git diff --check`

## 検証結果

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run api-client:operation-types:check`: pass
- `npm run api:openapi:check`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: fail -> 修正後 pass
- `npm run web:a11y:check`: pass
- `npm run typecheck:source`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass
- `npm run test:integration:local`: pass
- `npm run admin:workflow:check`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run acceptance:source:check`: pass
- `npm run aws:dev-uat:preflight-raw-input:fixture:check`: pass
- `git diff --check`: pass

## PR レビュー観点

- `suspendDocument` が admin-only / CSRF required であり、一般ユーザーが実行できないこと。
- 公開停止は logical delete に留まり、物理削除や外部 runtime 削除を実施済みに見せていないこと。
- 文書一覧と文書詳細の active/deleted 状態が local state と source gate で一貫していること。
- RAG 検索対象から除外する意図を弱めていないこと。

## リスク

- この slice は local/API 境界であり、実 S3 object delete、Bedrock KB / S3 Vectors delete、保持期間後 lifecycle の証跡ではない。
- `deleted` は local source gate の回答対象外状態として扱うが、実 retrieval index からの除外は AWS dev/UAT または別 slice で確認が必要。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4571360616
- セルフレビュー結果: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4571360612

## 状態

done
