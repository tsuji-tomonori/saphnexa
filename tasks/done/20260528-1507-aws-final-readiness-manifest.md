# AWS dev/UAT final readiness manifest

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

AWS dev/UAT の raw capture plan、execution bridge、raw input scaffold、materializer、evidence bundle は揃ってきたが、実行直前に operator が「どの evidence file が存在し、どの final gate を次に実行できるか」を一覧できる manifest はまだない。
実 AWS credentials がない環境では実行完了にできないため、readiness を `blocked_by_external_execution` として正直に出し、credentials と実 evidence が揃った場合だけ final gate 実行可能と判定する必要がある。

## 目的

AWS dev/UAT final execution 前の readiness manifest を生成・検査し、preflight / validation / evidence bundle に必要な input、final evidence、execution bridge、next commands、blockers を機械的に確認できるようにする。

## スコープ

- final readiness manifest builder/checker を追加する。
- manifest は raw capture plan、execution bridge、raw input path、final evidence path、bundle manifest path、final command order を参照する。
- 実 AWS credentials や実 evidence がない場合は ready にせず、blockers と next commands を出す。
- fixture check で missing evidence と ready evidence の両方を検査する。
- package scripts、Taskfile、CI/verify、runbook、local verification、docs check に反映する。
- 実 AWS deploy、Flyway apply、E2E、負荷試験、RAG品質評価はこのタスクでは実行しない。

## 実施計画

1. 既存 raw capture plan / execution bridge / evidence bundle の入出力を確認する。
2. final readiness manifest builder/checker と fixture check を追加する。
3. scripts、Taskfile、CI、docs/checkers を同期する。
4. targeted checks、`npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に final readiness manifest check を追記する。
- `docs/ops/local-verification.md` に final readiness manifest check と制約を追記する。

## 受け入れ条件

- [x] final readiness manifest が raw capture plan、execution bridge、preflight/validation raw input、final evidence、bundle manifest の状態を記録する。
- [x] 実 evidence がない場合、manifest が ready にならず blockers と next commands を返す。
- [x] fixture check が missing evidence path と ready evidence path の positive/negative branch を検査する。
- [x] runbook、local verification、CI/verify/Taskfile/docs check に final readiness manifest fixture が反映される。
- [x] 実 AWS credentials がないことを未実施制約として記録し、実 AWS dev/UAT 完了扱いにしない。

## 検証計画

- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run aws:dev-uat:execution-bridge:check`
- `npm run aws:dev-uat:raw-capture-plan:check`
- `npm run aws:dev-uat:materialized-flow:fixture:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:final-readiness:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- readiness manifest が実 AWS 未実行を ready と誤認しないこと。
- final command order と raw capture plan の順序が既存 runbook と矛盾しないこと。
- 実 AWS 未実行を完了扱いにしていないこと。

## リスク

- readiness manifest は実行前状態の構造検査であり、実 AWS dev/UAT 実行の代替ではない。

## 完了メモ

- 実装commit: `bd20123ed3605fc2483f55af73dc3837222c1492`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561310349
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561311458
- 作業レポート: `reports/working/20260528-1507-aws-final-readiness-manifest.md`

### 実行した検証

- `npm run aws:dev-uat:final-readiness:check`: pass
- `npm run aws:dev-uat:final-readiness:fixture:check`: pass
- `npm run aws:dev-uat:execution-bridge:check`: pass
- `npm run aws:dev-uat:raw-capture-plan:check`: pass
- `npm run aws:dev-uat:materialized-flow:fixture:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `task aws:dev-uat:final-readiness:fixture:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass

### 未実施・制約

- `aws sts get-caller-identity --output json`: fail。AWS credentials 未設定のため、実 AWS dev/UAT 実行、Flyway 実適用、E2E、性能、RAG品質評価、実 evidence 作成は未実施。
