# Evaluation run items boundary 作業完了レポート

## 受けた指示

`plan-20260529.txt` と `.workspace` の基本設計 v0.17 に沿って、TypeScript framework 実装をさらに進める。作業前に `main` を取り直し、Worktree Task PR Flow、task md、検証、PR 更新、レポート作成を行う。

## 要件整理

- 基本設計の API-38 では `getEvaluationRun` が run 集計だけでなく case別結果 `EvaluationRunItem[]` も返す。
- Admin UI は評価run詳細で case別結果を API 由来の `items` として表示する。
- DSQL repository は `evaluation_runs` と `evaluation_run_items` を admin-only 境界で取得する。
- 実 Step Functions 評価runner、Bedrock Evaluations job、case別実行、評価 HTML report、AppSync fan-out、実ブラウザ E2E は今回の完了対象外。

## 検討・判断

- 既存 API route 数は変えず、`getEvaluationRun` response に `items` を追加する方針にした。
- local store には評価run開始時に代表的な case別結果を保存し、UI では fallback data を持たず API response の `items` だけを表示する。
- DSQL は `evaluation_runs` を主 query とし、`evaluation_run_items` を JSON aggregation で同一 response に含める形にした。
- OpenAPI/Zod/generated API client type、DB metadata/db-types、source gate を同時更新して型共有の同期を保つ方針にした。

## 実施作業

- `packages/domain` に `EvaluationRunItem`、`evaluation_run_items` state、`getEvaluationRun` detail response を追加。
- `apps/api` の local API、OpenAPI document、Zod response schema、DSQL `getEvaluationRun` plan/map を `items` 付きに更新。
- `packages/db-schema` / `packages/db-types` に `evaluation_run_items` metadata/row type を追加。
- generated API client operation types を再生成。
- Web hook/types と Admin UI に評価case別結果 table を追加。
- `tools/check-web-flows.js`、`tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js`、`tools/check-type-surface.js`、`tools/check-api-openapi.js`、`tools/check-admin-workflows.js`、`tools/check-db-integrity.js`、`tests/integration-local.test.js`、`docs/ops/local-verification.md` を更新。
- task md に受け入れ条件と検証結果を反映。

## 成果物

- `getEvaluationRun` の `items` response。
- Admin 評価case別結果 table。
- `evaluation_run_items` の DB shared metadata/type と DSQL 取得境界。
- source/local/docs gate と本レポート。

## 検証

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run api-client:operation-types:check`: pass
- `npm run typecheck:source`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run api:openapi:check`: pass
- `npm run docs:check`: pass
- `npm run admin:workflow:check`: pass
- `npm run db:integrity:check`: pass
- `npm run test:integration:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `git diff --check`: pass
- `npm run web:build:check`: pass。Vite chunk size warning は出たが build output check は pass。

## 指示への fit 評価

総合fit: 4.6 / 5.0。基本設計の API-38 に近づく `items` 境界を local/source gate の範囲で満たした。実評価runner、Bedrock Evaluations、HTML report、AppSync fan-out、実ブラウザ E2E は未実施であり、対象外として UI/docs/task/PR で明示する。

## 未対応・制約・リスク

- 実 Aurora DSQL での SQL 実行は未実施。
- 実 Step Functions 評価runner、Bedrock Evaluations job、case別評価実行、評価 HTML report 生成、AppSync fan-out は未実装・未検証。
- 実ブラウザ E2E、CloudFront/Cognito 経由のロール別導線確認は未実施。
