# Evaluation run items boundary

## 背景

`.workspace` の基本設計 v0.17 では API-38 `getEvaluationRun` が評価runの状態、集計指標、case別結果を返すことになっている。現状 PR #3 の Admin 評価境界は `listEvaluationDatasets`、`startEvaluationRun`、`getEvaluationRun` の run 集計までは接続済みだが、`evaluation_run_items` の case別結果は API response、local store、DSQL plan、Admin UI にまだ通っていない。

## 目的

評価run詳細で case別評価結果を確認できる境界を追加する。run 集計と items を同じ `getEvaluationRun` response で返し、Admin UI、source/local gate、DB shared type/metadata、DSQL plan を同期する。

## タスク種別

機能追加

## スコープ

- local store に `evaluation_run_items` を追加し、評価run開始時に case別結果を保存する。
- API schema / generated client type が `getEvaluationRun` の `items` を表現できるようにする。
- DB shared metadata/types に `evaluation_run_items` を追加する。
- DSQL repository の `getEvaluationRun` plan が run detail と items を返すようにする。
- Admin UI に case別結果 table を追加する。
- source/UI/web/docs/local flow gate を更新する。
- 実 Step Functions 評価runner、Bedrock Evaluations job、case別実行、評価 HTML report、AppSync fan-out、実 Aurora DSQL 実行、実ブラウザ E2E は今回の対象外とする。

## 実装計画

1. Domain store/types に `EvaluationRunItem` と `evaluation_run_items` を追加し、local 評価run開始で fixture由来の case別結果を保存する。
2. OpenAPI/Zod schema と API client generated operation type を `items` 付き response に更新する。
3. DB table metadata / db-types と DSQL `getEvaluationRun` plan/map を items 付きに更新する。
4. Web types / AdminActions を更新し、case別結果 table を追加する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin 評価run詳細が case別 `evaluation_run_items` を local/source gate で確認すること、実評価runnerや Bedrock Evaluations は別途であることを追記する。

## 受け入れ条件

- [x] `getEvaluationRun` response が `evaluation_run` と `items` を返す。
- [x] Admin UI が評価runの case別結果を API 由来の `items` で表示する。
- [x] DSQL repository が admin-only 境界付きで `evaluation_runs` と `evaluation_run_items` を取得する。
- [x] DB shared metadata/types に `evaluation_run_items` が含まれる。
- [x] 一般ユーザーは local flow で評価run詳細と items を取得できない。
- [x] UI/source/docs/local flow gate が evaluation run items 境界を検査する。
- [x] 選定した検証コマンドが pass し、実 Step Functions 評価runner、Bedrock Evaluations job、評価 HTML report、AppSync fan-out、実ブラウザ E2E を実施済みに見せない。

## 検証計画

- [x] `npm run typecheck -w @saphnexa/api`
- [x] `npm run typecheck -w @saphnexa/web`
- [x] `npm run typecheck -w @saphnexa/db-types`
- [x] `npm run api-client:operation-types:check`
- [x] `npm run ui:check`
- [x] `npm run web:flow:check`
- [x] `npm run web:a11y:check`
- [x] `npm run api:openapi:check`
- [x] `npm run admin:workflow:check`
- [x] `npm run db:integrity:check`
- [x] `npm run typecheck:source`
- [x] `npm run docs:check`
- [x] `npm run web:build:check`
- [x] `npm run test:integration:local`
- [x] `npm run test:contract`
- [x] `npm test`
- [x] `git diff --check`

## 検証結果

2026-05-29 に上記コマンドはすべて pass。`web:build:check` では Vite の chunk size warning が出たが、production build と `tools/check-web-build-output.js` は pass。

## PR レビュー観点

- `evaluation_run_items` が admin-only detail 取得に閉じていること。
- UI が固定 case ID や demo result を fallback 表示しないこと。
- 実評価runnerや Bedrock Evaluations を実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実 Aurora DSQL 実行、実 Step Functions、実 Bedrock Evaluations、実ブラウザ操作の証跡ではない。
- case別結果は local fixture による代表データであり、実評価 case 実行は別 slice とする。

## 状態

acceptance_verified_pr_comment_pending
