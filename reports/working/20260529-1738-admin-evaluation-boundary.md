# Admin evaluation boundary 作業完了レポート

## 受けた指示

`plan-20260529.txt` と `.workspace` の基本設計に沿って、Admin 評価実行確認境界を進める。作業前に `main` を pull/fetch し、Worktree Task PR Flow、task md、検証、PR 更新、レポート作成を行う。

## 要件整理

- FR-EVAL-001〜002 / API-36〜38 のうち、評価データセット一覧、評価 run 開始、評価 run 詳細・metrics 確認の境界を対象にした。
- Admin UI は固定 dataset/run ID ではなく、API 由来の dataset list と run detail を表示する。
- DSQL repository は `listEvaluationDatasets` / `startEvaluationRun` / `getEvaluationRun` の query plan を持ち、admin-only 境界を含める。
- 実 Step Functions 評価 runner、Bedrock Evaluations job、評価 run items 一覧、評価 HTML report、AppSync fan-out、実ブラウザ E2E は今回の完了対象外。

## 検討・判断

- 既存の local API route と generated API client operation type は存在していたため、Web hooks と Admin UI を route helper / generated operation helper に接続した。
- DSQL 側は shared DB table metadata / db-types に evaluation tables を追加し、source gate で migration metadata と DSQL plan の同期を確認する方針にした。
- UI は `DataTable` と `StatusBadge` を使い、未接続の外部評価 pipeline は明示的な status text として表示した。

## 実施作業

- `evaluation_datasets` / `evaluation_runs` の DB shared type と table metadata を追加。
- DSQL repository に dataset list、evaluation run insert、evaluation run detail の query plan を追加。
- Web Admin に dataset list、dataset 選択、evaluation run start、run ID lookup、metrics/detail table を追加。
- `useEvaluationDatasets` / `useEvaluationRun` / `useStartEvaluationRun` を API client operation helper に接続。
- `tools/check-web-flows.js`、`tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js`、`tools/check-type-surface.js`、`docs/ops/local-verification.md` を更新。
- `tasks/do/20260529-1755-admin-evaluation-boundary.md` に受け入れ条件と検証結果を反映。

## 成果物

- Admin 評価データセット一覧と評価 run 詳細表示 UI。
- Admin-only evaluation DSQL query plan。
- Admin evaluation source/local gate と docs 追記。
- Task md と本レポート。

## 検証

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run api-client:operation-types:check`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run typecheck:source`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass。Vite chunk size warning は出たが build output check は pass。
- `npm run test:integration:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `git diff --check`: pass

## 指示への fit 評価

受け入れ条件は local/source gate の範囲で満たした。Web Admin は route helper / generated operation helper で evaluation APIs を使い、一般ユーザー拒否も local flow で確認した。実施していない外部評価 pipeline や実ブラウザ E2E は未実施として docs、task、UI に明記した。

## 未対応・制約・リスク

- 実 Aurora DSQL での SQL 実行は未実施。
- 実 Step Functions 評価 runner、Bedrock Evaluations job、評価 run items 一覧、評価 HTML report 生成、AppSync fan-out は未実装・未検証。
- 実ブラウザ E2E、CloudFront/Cognito 経由のロール別導線確認は未実施。
