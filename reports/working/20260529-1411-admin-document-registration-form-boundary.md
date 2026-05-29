# Admin document registration form boundary 作業完了レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` に沿って Saphnexa の TypeScript framework 実装を進める。
- 作業前に `origin/main` を取得してから進める。
- リポジトリローカルの Worktree Task PR Flow、commit / PR / self-review / report ルールに従う。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | Admin UI が `createDocument` route helper / generated operation helper で文書登録を実行する | 対応 |
| R2 | 登録フォームが React Hook Form + Zod と共通 UI components を使う | 対応 |
| R3 | 登録成功後に `adminListDocuments` query を再取得し、架空文書を表示しない | 対応 |
| R4 | local API flow と source/UI/web/docs gate が登録境界を検査する | 対応 |
| R5 | 実 S3 PDF upload / 文書種別 / 有効期間 / ACL 編集 / 取り込みジョブ詳細を実施済み扱いしない | 対応 |

## 検討・判断の要約

- 既存 `createDocument` API contract / API client / local API を利用し、新規 API を増やさず Web Admin のフォーム境界を追加した。
- フォームは React Hook Form + Zod で必須入力と `.pdf` file name を検証し、server state は TanStack Query mutation と query invalidation に寄せた。
- local API では、明示 metadata がない登録リクエストに対して、生成済みの `document_id` / `version_id` / `acl_scope` / `status` を metadata として補完するようにした。明示的に不完全な metadata を渡した場合の失敗挙動は維持した。
- UI と docs では、今回の対象が file name metadata と local ingestion job 受付であり、実 PDF binary upload / S3 配置ではないことを明記した。

## 実施作業

- `apps/web/src/hooks/useCreateDocument.ts` を追加し、`apiPostOperation("createDocument", apiRoutes.createDocument(), ...)` と `admin-documents` query invalidation を実装した。
- `apps/web/src/features/admin/DocumentRegistrationForm.tsx` を追加し、React Hook Form + Zod + `FormField` / `Input` / `Button` / `Dialog` / `StatusBadge` で文書登録フォームを実装した。
- Admin Dashboard の「文書」タブに登録フォームを追加した。
- `packages/domain/src/store.js` の local `createDocument` で metadata 未指定時の補完を追加した。
- source/UI/web/a11y/docs gate を Admin 文書登録フォーム境界に合わせて更新した。
- `docs/ops/local-verification.md` に検証範囲と未実装範囲を追記した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/web/src/hooks/useCreateDocument.ts` | `createDocument` mutation hook と文書一覧再取得 |
| `apps/web/src/features/admin/DocumentRegistrationForm.tsx` | Admin 文書登録フォーム |
| `apps/web/src/pages/AdminDashboardPage.tsx` | 文書タブへのフォーム接続 |
| `packages/domain/src/store.js` | metadata 未指定時の local 登録補完 |
| `docs/ops/local-verification.md` | 文書登録フォーム境界と未実装範囲の記録 |

## 実行した検証

- `git fetch origin main`: pass
- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: fail -> `exactOptionalPropertyTypes` 対応後 pass
- `npm run typecheck -w @saphnexa/ui`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run typecheck:source`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass
- `npm run test:integration:local`: pass
- `git diff --check`: pass

## Fit 評価

総合fit: 4.7 / 5.0

FR-DOC-001 のうち、Admin UI から文書登録 API を呼ぶフォーム境界、入力検証、登録後の一覧再取得、local ingestion job 受付確認は満たした。実 S3 PDF upload、文書種別、有効期間、ACL 編集、取り込みジョブ詳細は今回の対象外として明記しており、実施済み扱いしていないため満点ではない。

## 未対応・制約・リスク

- 実 PDF binary upload と S3 Raw bucket 配置は未対応。
- 文書種別、有効期間、ACL 編集 UI、取り込みジョブ詳細 UI は未対応。
- 実 Aurora DSQL executor / Step Functions ingestion workflow への接続実行は未検証。
- 実ブラウザ操作と visual regression は未検証。
