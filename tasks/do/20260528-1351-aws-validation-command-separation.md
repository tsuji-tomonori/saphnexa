# AWS dev/UAT validation command separation

- 状態: doing
- タスク種別: 修正
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

AWS dev/UAT の raw capture plan と runbook は、validation raw output を取得する段階で `npm run test:e2e:aws`、`npm run perf:aws`、`npm run rag:quality:aws` を実行する順序になっている。
しかし現状の npm script は `dist/acceptance/aws_dev_uat_validation.json` を読む final evidence gate であり、validation raw input から evidence を build する前には実行できない。

## 目的

raw output capture と final evidence gate の役割を分離し、実 AWS dev/UAT 実行者が循環しない順序で E2E・性能・RAG品質証跡を収集、build、final gate、bundle manifest 作成まで進められるようにする。

## スコープ

- raw capture plan の validation command を final gate script ではない capture helper に変更する。
- validation result capture helper と helper check を追加する。
- external action plan、runbook、local verification、docs check、CI/verify/Taskfile を同期する。
- `test:e2e:aws`、`perf:aws`、`rag:quality:aws` は validation evidence build 後の suite gate として残す。
- 実 AWS E2E、負荷試験、Bedrock Evaluations の実行そのものはこのタスクでは行わない。

## なぜなぜ分析

### 問題文

2026-05-28 時点の PR branch で、AWS dev/UAT validation raw output の取得手順が final evidence gate を先に呼ぶ順序になっており、`dist/acceptance/aws_dev_uat_validation.json` 作成前に validation suite gate を実行できない。

### 確認済み事実

- `package.json` の `test:e2e:aws`、`perf:aws`、`rag:quality:aws` は `tools/check-aws-dev-uat-validation.js dist/acceptance/aws_dev_uat_validation.json --suite=... --require-final` を実行する。
- `tools/aws-dev-uat-raw-capture-plan.js` の validation commands は `npm run test:e2e:aws`、`npm run perf:aws`、`npm run rag:quality:aws` を raw output command として記録している。
- `docs/ops/runbooks/aws-dev-uat-validation.md` と `tools/external-acceptance-actions.js` も同じ順序を含んでいる。

### 因果

- raw output capture command と final evidence gate command が同じ npm script 名で表現されていた。
- checker は command id と output ref の同期を検査していたが、validation evidence build 前に final gate script を呼んでいないかまでは検出していなかった。
- その結果、local fixture は pass しても、実 AWS 実行者が runbook 通りに進めると validation evidence 作成前の suite gate で詰まる順序が残った。

### 根本原因

raw capture plan に「外部で実行して raw output を生成する command」と「生成済み evidence を検証する final gate command」を区別する機械的 invariant がなかった。

### 対策

- validation raw capture command を dedicated capture helper に分離する。
- raw capture plan checker で validation capture command が final gate npm script を直接呼ばないことを検査する。
- external action plan と runbook を、capture helper / raw output check / raw input dry-run / validation build / suite gate / bundle manifest の順序へ同期する。

## 実施計画

1. validation capture helper と fixture check を追加する。
2. raw capture plan と checker の validation command を helper に差し替える。
3. external action plan、docs、package scripts、Taskfile、CI/verify を同期する。
4. targeted checks、`npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に capture helper と final suite gate の分離を記載する。
- `docs/ops/local-verification.md` に fixture check の意味と制約を追記する。

## 受け入れ条件

- [ ] validation raw capture plan が `npm run test:e2e:aws`、`npm run perf:aws`、`npm run rag:quality:aws` を raw output 生成 command として直接使わない。
- [ ] validation raw output capture helper が required env の missing failure と valid JSON output を検査できる。
- [ ] final suite gate (`test:e2e:aws` / `perf:aws` / `rag:quality:aws`) は validation build 後に実行される順序になっている。
- [ ] external action plan、runbook、local verification docs が新しい順序と制約を説明する。
- [ ] `npm run verify`、CI workflow、Taskfile、docs check に fixture check が反映される。

## 検証計画

- `npm run aws:dev-uat:validation-capture:fixture:check`
- `npm run aws:dev-uat:raw-capture-plan:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:validation-capture:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- capture helper が架空成功や sample fallback を出さないこと。
- final gate script が validation evidence build 前の raw output command として残っていないこと。
- 実 AWS 未実行を完了扱いにしていないこと。

## リスク

- capture helper は外部で実行済みの E2E・性能・RAG品質結果を JSON 化する導線であり、実テスト実行や Bedrock Evaluations job の開始は行わない。
