# Admin evaluation boundary

## 背景

`.workspace` の基本設計 v0.17 では FR-EVAL-001〜002 / API-36〜38 として、管理者が評価データセットを選択して評価 run を開始し、評価 run の検索品質、回答品質、権限制御品質などの指標を確認できることが定義されている。
現行 PR #3 では local API と簡易 Web 操作はあるが、`listEvaluationDatasets` / `startEvaluationRun` / `getEvaluationRun` の DSQL query plan と、Web Admin からデータセット一覧・run 詳細を確認する UI 境界が未接続である。

## 目的

Admin UI から評価データセット一覧を確認し、選択した dataset で評価 run を開始し、開始した run の詳細・metrics を取得できる境界を追加する。DSQL repository に API-36〜38 の query plan を追加し、admin-only 境界を source/local gate で確認する。

## タスク種別

機能追加

## スコープ

- DB shared types に `evaluation_datasets` / `evaluation_runs` row type を追加する。
- DSQL repository に `listEvaluationDatasets` / `startEvaluationRun` / `getEvaluationRun` query plan を追加する。
- Web hook と Admin evaluation panel を更新し、dataset list、run start、run detail を route helper / generated operation helper に接続する。
- source/UI/web/docs/local flow gate を更新する。
- 実 Step Functions 評価 runner、Bedrock Evaluations job、評価 run items 一覧、評価 HTML report 生成、AppSync fan-out、実 Aurora DSQL 実行は今回の対象外とする。

## 実装計画

1. `packages/db-types` に evaluation row type を追加する。
2. DSQL repository に admin user 境界付きの dataset list、evaluation run insert、run detail query plan を追加する。
3. Web hook に `useEvaluationDatasets` / `useEvaluationRun` と start mutation invalidation を追加する。
4. Admin evaluation UI を DataTable + detail lookup つきに更新する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin evaluation は route helper / generated operation helper と local/source gate で dataset list、run start、run detail を確認し、実 Step Functions / Bedrock Evaluations / 評価 HTML report / AppSync fan-out は別途であることを追記する。

## 受け入れ条件

- [x] Web Admin が `listEvaluationDatasets` / `startEvaluationRun` / `getEvaluationRun` route helper / generated operation helper を使う。
- [x] Admin UI が評価データセット一覧、評価実行、run 詳細・metrics を実データ由来で表示する。
- [x] DSQL repository が admin-only 境界付きで dataset list、run insert、run detail を扱う。
- [x] 一般ユーザーは local flow で evaluation APIs を実行できない。
- [x] UI/source/docs/local flow gate が Admin evaluation 境界を検査する。
- [x] 選定した検証コマンドが pass し、実 Step Functions 評価 runner、Bedrock Evaluations job、評価 run items 一覧、評価 HTML report 生成、AppSync fan-out、実ブラウザ E2E を実施済みに見せない。

## 検証計画

- [x] `npm run typecheck -w @saphnexa/api`
- [x] `npm run typecheck -w @saphnexa/web`
- [x] `npm run typecheck -w @saphnexa/db-types`
- [x] `npm run api-client:operation-types:check`
- [x] `npm run ui:check`
- [x] `npm run web:flow:check`
- [x] `npm run web:a11y:check`
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

- evaluation APIs が admin-only 境界を越えていないこと。
- Web が固定 dataset/run ID や demo metrics を本番 fallback として表示していないこと。
- 実 Step Functions / Bedrock Evaluations / report 生成を実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実 Aurora DSQL 実行、実 Step Functions、実 Bedrock Evaluations、実ブラウザ操作の証跡ではない。
- 評価 run items 一覧や評価 HTML report の閲覧は別 slice とする。

## 状態

done
