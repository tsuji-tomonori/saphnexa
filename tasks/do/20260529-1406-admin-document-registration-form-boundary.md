# Admin document registration form boundary

## 背景

`.workspace` の基本設計では、管理者が PDF、文書名、文書種別、ACL、有効期間を入力して文書を登録できることが FR-DOC-001 として定義されている。
現行 PR #3 では `createDocument` API contract / API client / local API は存在し、Admin 文書一覧タブも追加済みだが、Web Admin から文書登録 API を呼ぶフォーム境界は未実装である。

## 目的

Admin Dashboard の文書タブから、既存 `createDocument` API を generated operation helper / route helper 経由で呼び出せるようにし、登録後に文書一覧を再取得する。PDF 実アップロードは未実装であることを UI と docs で正直に示す。

## タスク種別

機能追加

## スコープ

- `apps/web` に `useCreateDocument` hook を追加する。
- `apps/web` に React Hook Form + Zod を使う `DocumentRegistrationForm` を追加する。
- Admin Dashboard の「文書」タブに登録フォームを追加し、登録後に `adminListDocuments` query を invalidate する。
- 登録フォームは `title`、`file_name`、`version_label`、`acl_scope_id` を受け付け、PDF 実アップロードではなく local/API 境界用の file name metadata であることを表示する。
- UI/source/web/docs gate を更新する。
- 実 S3 PDF upload、文書種別、有効期間、ACL 編集 UI、取り込みジョブ詳細 UI は今回の対象外とする。

## 実装計画

1. `useCreateDocument` hook を API client generated helper と route helper で実装する。
2. `DocumentRegistrationForm` を React Hook Form + Zod + shared UI components で実装する。
3. Admin Dashboard の文書タブに form と table を配置し、mutation 成功時に一覧 query を invalidate する。
4. source/UI/web/docs gate を追加・更新する。
5. Web/API/source/docs/build/local integration/diff check を実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin 文書登録フォームは `createDocument` API 境界と local ingestion job 作成を source gate で確認すること、実 PDF upload / S3 配置 / 文書種別 / 有効期間 / ACL 編集は別途であることを追記する。

## 受け入れ条件

- [ ] Admin UI が `createDocument` route helper / generated operation helper 経由で文書登録を実行する。
- [ ] 登録フォームが React Hook Form + Zod と共通 UI components を使い、必須入力と empty/error/pending/success state を表示する。
- [ ] 登録成功後に `adminListDocuments` の query が再取得され、架空文書や固定件数を表示しない。
- [ ] local API flow と source/UI/web/docs gate が Admin 文書登録フォーム境界を検査する。
- [ ] 選定した検証コマンドが pass し、実 S3 PDF upload / 文書種別 / 有効期間 / ACL 編集 / 取り込みジョブ詳細を実施済み扱いしない。

## 検証計画

- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck -w @saphnexa/api`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `npm run test:integration:local`
- `git diff --check`

## PR レビュー観点

- Web UI が PDF 実アップロードや登録済み文書を架空値で表示していないこと。
- `createDocument` が API client generated operation helper と route helper を通ること。
- CSRF token がない状態では登録操作できないこと。
- 登録成功後に文書一覧の再取得境界があること。
- 未実装の S3 upload / 文書種別 / 有効期間 / ACL 編集 / 取り込みジョブ詳細を実装済みに見せていないこと。

## リスク

- この slice は文書登録 API 境界フォームであり、実 PDF binary upload や S3 配置の証跡ではない。
- local API は `file_name` から raw S3 URI を生成するが、実ファイルの存在確認は行わない。

## 状態

do
