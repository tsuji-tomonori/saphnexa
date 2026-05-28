# AWS dev/UAT operator input template

状態: doing

## 背景

AWS dev/UAT E2E・性能・RAG 品質検証は、deploy/publish、raw output capture、materialize、final gate の順序を `operator handoff` にまとめ済み。ただし operator が実行前に確定すべき release/AWS/run/artifact 入力値を 1 つの manifest として検査できないため、placeholder のまま raw input materialization command へ進む余地がある。

## 目的

7. AWS dev/UAT E2E・性能・RAG 品質検証に向け、operator が実行前に埋める入力 template と resolved input checker を追加し、`<release-tag>` や `<aws-account-id>` のような未解決値を local gate で拒否する。

## タスク種別

機能追加

## スコープ

- AWS dev/UAT operator input scaffold の生成。
- resolved operator input の構造・値・placeholder rejection checker。
- external action plan / operator handoff / docs / CI / Taskfile / package scripts への結合。
- 実 AWS deploy、migration、publish、E2E、load test、Bedrock Evaluations の実行は対象外。

## 計画

1. 既存 raw capture plan と operator handoff の required inputs を読み、重複しない manifest schema を設計する。
2. `tools/` に scaffold builder、checker、fixture checker を追加する。
3. `package.json`、`Taskfile.yml`、CI、docs check、runbook/local verification を更新する。
4. targeted checks と broad verify を実行する。
5. 作業レポートを残し、commit/push、PR コメント、task done 移動まで行う。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に operator input の作成・検査手順を追加する。
- `docs/ops/local-verification.md` に新しい local gate と「実 AWS 完了扱いにしない」制約を追記する。
- `tools/check-docs.js` に docs 同期 gate を追加する。

## 受け入れ条件

- [ ] `npm run aws:dev-uat:operator-input:check` が scaffold を生成し、schema、required inputs、実行順序との対応、placeholder の警告を検査する。
- [ ] `npm run aws:dev-uat:operator-input:fixture:check` が resolved sample を pass させ、scaffold/placeholder/不正 AWS account/未解決 URL を reject する。
- [ ] operator handoff または external action plan が operator input path / check command を参照し、AWS dev/UAT validation 実行前に入力検査を挟む。
- [ ] `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、`tools/check-ci-workflow.js`、`tools/check-docs.js`、docs が新 command と同期している。
- [ ] 実 AWS credentials がない状態でも local 構造確認は pass し、実 AWS dev/UAT 完了とは扱わないことを docs/report/PR に明記する。

## 検証計画

- `npm run aws:dev-uat:operator-input:check`
- `npm run aws:dev-uat:operator-input:fixture:check`
- `npm run aws:dev-uat:operator-handoff:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:operator-input:check`
- `task aws:dev-uat:operator-input:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は credentials 未設定なら fail/未完了制約として記録する。

## PR レビュー観点

- operator input は実行を代行せず、承認必須の外部操作を pending のまま残しているか。
- placeholder / sample / localhost / dummy 値を final input として許容していないか。
- docs と実装、CI gate、Taskfile command が同期しているか。
- RAG の根拠性・認可境界、benchmark 期待語句や dataset 固有分岐を弱めていないか。

## リスク

- 実 AWS credentials がないため、AWS dev/UAT の実実行完了は検証できない。
- manifest schema は operator handoff と raw input materializer の間の補助 gate であり、実 AWS の認証・承認・外部状態変更は別途 operator 実行が必要。
