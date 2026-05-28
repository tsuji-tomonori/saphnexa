# AWS dev/UAT materialized evidence flow

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

preflight raw input materializer と validation raw input materializer は個別に検査できるが、両方を組み合わせて preflight evidence、validation evidence、evidence bundle manifest まで進める一気通貫の fixture gate はまだない。
実 AWS dev/UAT 実行時には、preflight raw output 取得、preflight raw input materialization、preflight final gate、validation raw output 取得、validation raw input materialization、validation final gate、bundle manifest の順に進むため、この流れを repo 内で構造検査できる必要がある。

## 目的

sample raw output と scaffold から preflight / validation raw input を materialize し、final evidence build と evidence bundle manifest check まで通す materialized evidence flow fixture を追加する。

## スコープ

- materialized evidence flow fixture check を追加する。
- fixture は preflight / validation の materializer を両方使い、raw output check、raw input dry-run、final evidence build、suite gate、bundle manifest を通す。
- missing materialized raw input / missing raw output の negative path を検査する。
- package scripts、Taskfile、CI/verify、runbook、local verification、docs check に反映する。
- 実 AWS deploy、Flyway apply、E2E、負荷試験、RAG品質評価はこのタスクでは実行しない。

## 実施計画

1. 既存 preflight / validation materializer と evidence bundle checker の入出力を確認する。
2. materialized evidence flow fixture check を追加する。
3. scripts、Taskfile、CI、docs/checkers を同期する。
4. targeted checks、`npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に materialized flow fixture check を追記する。
- `docs/ops/local-verification.md` に fixture check と制約を追記する。

## 受け入れ条件

- [x] preflight / validation raw input をそれぞれ materializer で生成し、raw output/input check を通せる。
- [x] 生成 raw input から preflight / validation final evidence を作り、validation suite gate と evidence bundle manifest を通せる。
- [x] evidence bundle manifest が materialized raw input、raw output、final evidence、execution bridge artifact を含む。
- [x] fixture check が missing materialized raw input と missing raw output の negative path を検査する。
- [x] runbook、local verification、CI/verify/Taskfile/docs check に materialized flow fixture が反映される。

## 検証計画

- `npm run aws:dev-uat:materialized-flow:fixture:check`
- `npm run aws:dev-uat:preflight-raw-input:fixture:check`
- `npm run aws:dev-uat:validation-raw-input:fixture:check`
- `npm run aws:dev-uat:evidence-bundle:fixture:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:materialized-flow:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- materialized flow fixture が sample fallback を final evidence と誤認しないこと。
- raw output / raw input / final evidence / bundle manifest の順序が実 AWS 実行手順と矛盾しないこと。
- 実 AWS 未実行を完了扱いにしていないこと。

## リスク

- fixture は sample raw output を使う構造検査であり、実 AWS dev/UAT 実行の代替ではない。

## 完了メモ

- 実装commit: `631cb7483784c4b9fffdc6e2ba76d35095e9004a`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561239623
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561243235
- 作業レポート: `reports/working/20260528-1451-aws-materialized-evidence-flow.md`

### 実行した検証

- `npm run aws:dev-uat:materialized-flow:fixture:check`: pass
- `npm run aws:dev-uat:preflight-raw-input:fixture:check`: pass
- `npm run aws:dev-uat:validation-raw-input:fixture:check`: pass
- `npm run aws:dev-uat:evidence-bundle:fixture:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `task aws:dev-uat:materialized-flow:fixture:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass

### 未実施・制約

- `aws sts get-caller-identity --output json`: fail。AWS credentials 未設定のため、実 AWS dev/UAT 実行、Flyway 実適用、E2E、性能、RAG品質評価、実 evidence 作成は未実施。
