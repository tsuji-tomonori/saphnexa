# Admin user import boundary 作業完了レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` に沿って Saphnexa の TypeScript framework 実装を進める。
- 作業前に `origin/main` を取得してから進める。
- リポジトリローカルの Worktree Task PR Flow、commit / PR / self-review / report ルールに従う。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | Admin UI が `adminListUsers` / `startUserImport` / `getUserImport` route helper / generated operation helper でユーザー一覧・取込開始・結果確認を行う | 対応 |
| R2 | ユーザー取込 UI が React Hook Form + Zod と共通 UI components を使う | 対応 |
| R3 | 取込成功後に `adminListUsers` と対象 `user-import` query を再取得し、架空ユーザーや固定件数を表示しない | 対応 |
| R4 | local API / DSQL repository / source/UI/web/docs gate が Admin ユーザー取込境界を検査する | 対応 |
| R5 | CSV/Excel binary upload、S3 import file 配置、Cognito 実反映、AppSync 通知を実施済み扱いしない | 対応 |

## 検討・判断の要約

- 既存 `adminListUsers` / `startUserImport` / `getUserImport` API contract を利用し、新規 API を増やさず Web Admin のユーザー管理境界を追加した。
- 基本設計では CSV/Excel upload が最終要件だが、現 API は `rows` payload を受けるため、今回の UI は JSON rows 入力として実装し、CSV/Excel 実アップロードは未接続と表示した。
- local API の `adminListUsers` は `store` method に寄せ、tenant/admin 境界を明示した。
- DSQL repository は `adminListUsers` の読み取り query plan を追加し、admin actor と同一 tenant の user 一覧に限定した。
- 取込成功後は `admin-users` と対象 `user-import` query を invalidate し、API response 由来の一覧・結果だけを表示する方針にした。

## 実施作業

- `apps/web/src/hooks/useAdminUsers.ts` を追加し、`adminListUsers` query を実装した。
- `apps/web/src/hooks/useUserImport.ts` を追加し、`startUserImport` mutation と `getUserImport` query を実装した。
- `apps/web/src/features/admin/UserImportPanel.tsx` を追加し、JSON rows 入力、取込結果集計、行別結果表示を実装した。
- `apps/web/src/features/admin/UserTable.tsx` を追加し、`DataTable` でユーザー一覧を表示した。
- Admin Dashboard に「ユーザー」タブを追加した。
- `packages/domain/src/store.js` / `store-types.ts` に `listAdminUsers` を追加し、local API の direct state access を解消した。
- `apps/api/src/repositories/dsql/apiRepository.ts` に `adminListUsers` query plan を追加した。
- source/UI/web/a11y/docs gate を Admin ユーザー取込境界に合わせて更新した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/web/src/hooks/useAdminUsers.ts` | 管理者ユーザー一覧 hook |
| `apps/web/src/hooks/useUserImport.ts` | ユーザー取込開始・結果取得 hook |
| `apps/web/src/features/admin/UserImportPanel.tsx` | JSON rows による user import 境界 UI |
| `apps/web/src/features/admin/UserTable.tsx` | ユーザー一覧 DataTable |
| `apps/api/src/repositories/dsql/apiRepository.ts` | `adminListUsers` DSQL query plan |
| `docs/ops/local-verification.md` | ユーザー取込境界と未実装範囲の記録 |

## 実行した検証

- `git fetch origin main`: pass
- `npm run typecheck -w @saphnexa/api`: fail -> `LocalUser` 型名修正後 pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run typecheck:source`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass
- `npm run test:integration:local`: pass
- `git diff --check`: pass

## Fit 評価

総合fit: 4.6 / 5.0

FR-ADMIN-USER-001〜002 のうち、管理 UI からユーザー一覧、取込開始、取込結果集計、行別エラー確認を行う API/UI/source gate 境界は満たした。CSV/Excel binary upload、S3 import file 配置、Cognito 実反映、AppSync 完了通知は未対応として明記しており、実施済み扱いしていないため満点ではない。

## 未対応・制約・リスク

- CSV/Excel binary upload とファイル形式検証は未対応。
- S3 import file 配置、Cognito 実反映、AppSync 完了通知は未検証。
- DSQL は `adminListUsers` の読み取り query plan までで、user import mutation の実 DSQL 実行は未対応。
- 実ブラウザ操作と visual regression は未検証。
