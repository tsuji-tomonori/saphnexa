# AWS dev/UAT evidence bundle manifest

- 状態: doing
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

AWS dev/UAT の raw capture plan、raw input scaffold、raw output content check、raw input dry-run、final evidence builder は整備済みだが、最終投入時に raw input、raw output、preflight evidence、validation evidence、execution bridge を 1 つの evidence bundle として検査・監査する manifest がない。

## 目的

実 AWS 検証後に提出する証跡一式を bundle manifest として検査し、必要 artifact の存在、checksum、raw output content、raw input dry-run、final evidence gate の整合を 1 コマンドで確認できるようにする。

## スコープ

- evidence bundle checker CLI と fixture check を追加する。
- bundle manifest に path、size、sha256、mode、生成元 command を記録する。
- external action plan の順序を、実 E2E/性能/RAG品質実行後に validation raw input を検査・build する形へ補正する。
- npm scripts、Taskfile、CI、verify、docs check、runbook、local verification docs に反映する。
- 実 AWS command 実行や実 evidence bundle 作成はこのタスクでは行わない。

## 実施計画

1. 既存 raw input/output checker と final evidence checker を確認する。
2. evidence bundle checker と fixture check を追加する。
3. package scripts、Taskfile、CI、docs check、external action plan、verify に組み込む。
4. runbook と local verification docs を更新する。
5. targeted checks、`npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に evidence bundle check を追記する。
- `docs/ops/local-verification.md` に fixture check の意味と制約を追記する。

## 受け入れ条件

- [ ] `node tools/check-aws-dev-uat-evidence-bundle.js ...` で raw input、raw output、preflight evidence、validation evidence を bundle manifest として検査できる。
- [ ] bundle manifest に各 artifact の path、size、sha256 が記録される。
- [ ] checker は raw output content check、raw input dry-run、preflight final gate、validation final gate を通す。
- [ ] fixture check が sample raw input から一時 evidence bundle を作成し、negative path も検査する。
- [ ] external action plan が E2E/性能/RAG品質実行後に validation raw output/input/evidence build を行う順序になっている。
- [ ] `npm run verify`、CI workflow、Taskfile、external acceptance actions、docs check に bundle checker が反映される。
- [ ] runbook と local verification docs に bundle check の手順と制約が記載される。

## 検証計画

- `npm run aws:dev-uat:evidence-bundle:fixture:check`
- `npm run aws:dev-uat:raw-output:fixture:check`
- `npm run aws:dev-uat:raw-input:fixture:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:evidence-bundle:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- bundle checker が AWS command を実行しないこと。
- sample fixture を final evidence として扱わないこと。
- final evidence と raw input/raw output の checksum を manifest で追えること。

## リスク

- bundle manifest は提出証跡の整合を検査するが、実 AWS credentials と実 raw output がなければ最終検証完了の根拠にはならない。
