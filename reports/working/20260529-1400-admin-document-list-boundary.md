# Admin document list boundary 作業完了レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` に沿って Saphnexa の TypeScript framework 実装を進める。
- この continuation では、作業前に `origin/main` を取得してから進める。
- リポジトリローカルの Worktree Task PR Flow、commit / PR / self-review / report ルールに従う。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | Admin UI が `adminListDocuments` route helper / generated operation helper で文書一覧を取得する | 対応 |
| R2 | Admin Dashboard に「文書」タブを追加し、API response 由来の文書だけを表示する | 対応 |
| R3 | local API と DSQL repository に admin document list 境界を追加し、管理者ロール境界を弱めない | 対応 |
| R4 | source/UI/web/docs gate で Admin 文書一覧境界を検査する | 対応 |
| R5 | PDF upload / 文書登録フォームを実施済み扱いしない | 対応 |

## 検討・判断の要約

- 既存 API contract / API client に `adminListDocuments` があるため、Web UI は新規 API ではなく既存 generated operation helper と route helper に接続した。
- 本番 UI で架空文書を表示しない方針を優先し、文書がない場合は `DataTable` の empty state を使う構成にした。
- DSQL repository は既存の `listPublishedArtifacts` と同じく `users` join で admin / active actor を確認する query plan とした。
- PDF upload、文書登録フォーム、ACL 編集、取り込みジョブ詳細は今回の境界外として docs に未実装範囲を明記した。

## 実施作業

- `apps/web` に `useAdminDocuments` hook と `DocumentTable` を追加し、Admin Dashboard の Tabs に「文書」タブを追加した。
- `apps/api/src/local-api.js` と `packages/domain/src/store.js` / `store-types.ts` に `listDocuments` / `getDocument` 境界を追加した。
- `apps/api/src/repositories/dsql/apiRepository.ts` に `adminListDocuments` の DSQL query plan を追加した。
- `packages/db-types/src/index.ts` に `documents` の行型を追加し、DSQL result table 型に接続した。
- `tools/check-web-flows.js`、`tools/check-web-accessibility-report.js`、`tools/check-ui-quality.js`、`tools/check-type-surface.js` に Admin 文書一覧の source gate を追加した。
- `docs/ops/local-verification.md` に Admin 文書一覧の確認範囲と未実装範囲を追記した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/web/src/hooks/useAdminDocuments.ts` | `adminListDocuments` を TanStack Query で取得する hook |
| `apps/web/src/features/admin/DocumentTable.tsx` | API response 由来の文書一覧を表示する `DataTable` |
| `apps/web/src/pages/AdminDashboardPage.tsx` | Admin Tabs の「文書」タブ |
| `apps/api/src/local-api.js` / `packages/domain/src/store.js` | local API の文書一覧・取得境界 |
| `apps/api/src/repositories/dsql/apiRepository.ts` | DSQL の admin 文書一覧 query plan |
| `docs/ops/local-verification.md` | ローカル検証範囲と未実装範囲の更新 |

## 実行した検証

- `git fetch origin main`: pass
- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: fail -> gate token 修正後 pass
- `npm run web:a11y:check`: fail -> gate token 修正後 pass
- `npm run typecheck:source`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass
- `npm run test:integration:local`: pass
- `git diff --check`: pass

## Fit 評価

総合fit: 4.8 / 5.0

主要要件である Admin 文書一覧の UI/API/DSQL/source gate 接続は満たした。PDF upload、文書登録フォーム、ACL 編集、取り込みジョブ詳細はスコープ外として明記し、実施済み扱いしていない。実ブラウザ操作や実 DSQL 接続は今回のローカル source/build/integration gate では未検証のため満点ではない。

## 未対応・制約・リスク

- PDF upload、文書登録フォーム、ACL 編集、取り込みジョブ詳細 UI は未対応。
- DSQL query plan は型・source gate で確認したが、実 Aurora DSQL executor に対する接続実行は未検証。
- 実ブラウザでの Admin tab 操作と visual regression は未検証。
