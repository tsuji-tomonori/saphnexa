# Admin ingestion job monitor boundary 作業完了レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` に沿って Saphnexa の TypeScript framework 実装を進める。
- 作業前に `origin/main` を取得してから進める。
- リポジトリローカルの Worktree Task PR Flow、commit / PR / self-review / report ルールに従う。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | Admin UI が `getIngestionJob` / `retryIngestionJob` route helper / generated operation helper で取り込みジョブを取得・再実行する | 対応 |
| R2 | 取り込みジョブ UI が React Hook Form + Zod と共通 UI components を使う | 対応 |
| R3 | retry 操作は CSRF token と retryable job がない状態では実行できず、成功後に対象 job query を再取得する | 対応 |
| R4 | local API / DSQL repository / source/UI/web/docs gate が境界を検査する | 対応 |
| R5 | 実 Step Functions / S3 / KB / S3 Vectors ingestion や job 一覧 API を実施済み扱いしない | 対応 |

## 検討・判断の要約

- 既存 `getIngestionJob` / `retryIngestionJob` API contract を利用し、新規 job 一覧 API は追加しない範囲で FR-DOC-002 の状態確認境界を前進させた。
- Web UI は job ID 指定の確認に限定し、架空 job や固定進捗 percentage は表示しない構成にした。
- retry は `retryable` かつ CSRF token がある場合のみ実行できるようにし、成功後は対象 job query を invalidate する構成にした。
- local API の `getIngestionJob` は `store` method に移し、tenant/admin 境界を明示した。
- DSQL query plan は `users` join で admin / active actor を確認し、`status === "failed"` から retryable を導出する読み取り境界とした。

## 実施作業

- `apps/web/src/hooks/useIngestionJob.ts` を追加し、`getIngestionJob` query と `retryIngestionJob` mutation を実装した。
- `apps/web/src/features/admin/IngestionJobPanel.tsx` を追加し、job ID 入力、状態表示、失敗理由、raw/parsed path、retry 操作を実装した。
- Admin Dashboard の「文書」タブに取り込みジョブ確認 UI を追加した。
- `packages/domain/src/store.js` / `store-types.ts` に `getIngestionJob` を追加し、retry の tenant 境界も明示した。
- `apps/api/src/repositories/dsql/apiRepository.ts` に `getIngestionJob` query plan を追加し、`packages/db-types` に `ingestion_jobs` row 型を追加した。
- source/UI/web/a11y/docs gate を Admin 取り込みジョブ確認境界に合わせて更新した。
- `docs/ops/local-verification.md` に検証範囲と未実装範囲を追記した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/web/src/hooks/useIngestionJob.ts` | 取り込みジョブ取得・再実行 hook |
| `apps/web/src/features/admin/IngestionJobPanel.tsx` | Admin 取り込みジョブ確認 UI |
| `apps/api/src/repositories/dsql/apiRepository.ts` | `getIngestionJob` DSQL query plan |
| `packages/domain/src/store.js` | local get/retry の tenant/admin 境界 |
| `docs/ops/local-verification.md` | 取り込みジョブ確認境界と未実装範囲の記録 |

## 実行した検証

- `git fetch origin main`: pass
- `npm run typecheck -w @saphnexa/api`: fail -> DSQL row 型 narrowing 後 pass
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

総合fit: 4.7 / 5.0

FR-DOC-002 のうち、管理 UI から job ID 指定で取り込み状態を確認し、retryable な失敗ジョブを再実行する API/UI/source gate 境界は満たした。実 Step Functions、S3 raw/parsed 実配置、Bedrock KB / S3 Vectors ingestion、進捗 percentage、job 一覧 API は未対応として明記しており、実施済み扱いしていないため満点ではない。

## 未対応・制約・リスク

- 実 Step Functions ingestion workflow の起動・監視は未対応。
- 実 S3 raw/parsed 配置、Bedrock KB sync、S3 Vectors 登録は未検証。
- 進捗 percentage と job 一覧 API / UI は未対応。
- 実 Aurora DSQL executor に対する query 実行は未検証。
- 実ブラウザ操作と visual regression は未検証。
