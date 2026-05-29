# Admin document ACL update boundary

## 背景

`.workspace` の基本設計では FR-DOC-003 / D-011 / NFR-BAS-001 として、文書ACLをDB正本として保持し、検索前filterと検索後ACL再確認に使うことが定義されている。
現行 PR #3 では Admin 文書詳細に ACL 一覧を表示できるが、管理者が登録後に文書版の公開範囲を変更する API/UI 境界は未接続である。

## 目的

Admin 文書管理から文書版 ACL scope を更新できる API/UI 境界を追加する。実 Cognito グループ反映や Bedrock KB / S3 Vectors metadata 再同期は実施せず、local/source gate では `document_acl_entries` の DB 正本更新と RAG ACL 境界を弱めないことを確認する。

## タスク種別

機能追加

## スコープ

- `packages/api-contract` / `packages/api-client` に文書 ACL 更新 API route/helper を追加する。
- `apps/api` の OpenAPI/Zod schema、local API、DSQL repository query plan に文書 ACL 更新境界を追加する。
- `packages/domain` local store に admin-only 文書版 ACL 更新操作を追加する。
- Admin 文書 lifecycle UI に ACL 更新フォームを追加する。
- source/UI/web/docs/admin workflow gate を更新する。
- Cognito group 反映、Bedrock KB / S3 Vectors metadata 再同期、実 retrieval index 再構築は今回の対象外とする。

## 実装計画

1. API route `updateDocumentAcl` を `POST /api/admin/documents/{document_id}/versions/{version_id}/acl` として追加する。
2. OpenAPI/Zod/client generated 型と route helper を更新する。
3. local store/API で admin role / tenant boundary を維持して対象文書版の `document_acl_entries` を置換する。
4. DSQL repository に admin role / tenant boundary 付きの ACL upsert/delete query plan を追加する。
5. Admin UI の文書版 lifecycle panel に ACL 更新フォームと未接続範囲の表示を追加する。
6. source/UI/web/docs/admin workflow gates と local verification docs を更新する。
7. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin 文書 ACL 更新は `document_acl_entries` の local/source 境界として確認し、Cognito group 反映、Bedrock KB / S3 Vectors metadata 再同期、実 retrieval index 再構築は別途であることを追記する。

## 受け入れ条件

- [x] API contract / API client に `updateDocumentAcl` が追加され、CSRF 必須の admin-only route になる。
- [x] local store/API が管理者だけに文書版 ACL 更新を許可し、対象文書版の `document_acl_entries` を置換する。
- [x] Admin UI が `updateDocumentAcl` route helper / generated operation helper 経由で ACL を更新し、Cognito group や KB/S3 Vectors 反映を実施済みに見せない。
- [x] DSQL repository と source/UI/web/docs/admin workflow gate が文書 ACL 更新境界を検査する。
- [x] 選定した検証コマンドが pass し、RAG の認可境界を弱めた変更がない。

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

## PR レビュー観点

- `updateDocumentAcl` が admin-only / CSRF required であり、一般ユーザーが実行できないこと。
- ACL 更新が tenant / document / version 境界を越えないこと。
- `document_acl_entries` を DB 正本として扱い、RAG ACL post-check 方針を緩和していないこと。
- Cognito group 反映、KB metadata 再同期、S3 Vectors 再構築を実施済みに見せていないこと。

## リスク

- この slice は local/API 境界であり、実 Cognito group 反映、Bedrock KB / S3 Vectors metadata 再同期、実 retrieval index 再構築の証跡ではない。
- ACL 変更後の実検索結果反映は AWS dev/UAT または別 slice で確認が必要。

## 検証結果

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run api-client:operation-types:check`: pass
- `npm run api:openapi:check`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: fail -> source token 改行を修正後 pass
- `npm run web:a11y:check`: pass
- `npm run typecheck:source`: fail -> source token 改行を修正後 pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass
- `npm run test:integration:local`: pass
- `npm run admin:workflow:check`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run acceptance:source:check`: pass
- `npm run aws:dev-uat:preflight-raw-input:fixture:check`: pass
- `git diff --check`: pass

## 状態

in_progress
