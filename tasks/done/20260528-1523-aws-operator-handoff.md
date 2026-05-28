# AWS dev/UAT operator handoff

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

AWS dev/UAT 実行に必要な raw capture plan、external action plan、execution bridge、final readiness manifest は揃ってきたが、実行担当者に渡す承認必須の command order、required inputs、evidence outputs、現時点の blocked 状態を 1 つに集約した handoff artifact はまだない。
7 の実行では deploy / publish / migration / E2E / load test / Bedrock evaluation など外部状態変更を伴うため、実行前に承認対象と未実施状態を明確にし、local fixture を実 AWS 完了と誤認しない必要がある。

## 目的

AWS dev/UAT operator handoff artifact を生成・検査し、実 AWS 実行前の承認対象、実行順、必須入力、evidence outputs、現在の blockers を機械的に確認できるようにする。

## スコープ

- operator handoff builder/checker を追加する。
- handoff は external action plan、raw capture plan、final readiness manifest を参照する。
- handoff は external state change command を実行せず、承認必須の pending action として列挙する。
- fixture check で未実施/pending 状態と ready-for-handoff 構造を検査する。
- package scripts、Taskfile、CI/verify、runbook、local verification、docs check に反映する。
- 実 AWS deploy、Flyway apply、E2E、負荷試験、RAG品質評価はこのタスクでは実行しない。

## 実施計画

1. 既存 external action plan、raw capture plan、final readiness manifest の入出力を確認する。
2. operator handoff builder/checker と fixture check を追加する。
3. scripts、Taskfile、CI、docs/checkers を同期する。
4. targeted checks、`npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に operator handoff check を追記する。
- `docs/ops/local-verification.md` に operator handoff check と制約を追記する。

## 受け入れ条件

- [x] operator handoff が external action plan、raw capture plan、final readiness manifest の要点を集約する。
- [x] handoff が deploy / publish / migration / E2E / performance / RAG quality / final readiness の command order と evidence outputs を含む。
- [x] handoff が external state change を実行せず、承認必須 pending actions と blockers を明示する。
- [x] fixture check が pending handoff と ready-for-handoff 構造を検査する。
- [x] runbook、local verification、CI/verify/Taskfile/docs check に operator handoff fixture が反映される。
- [x] 実 AWS credentials がないことを未実施制約として記録し、実 AWS dev/UAT 完了扱いにしない。

## 検証計画

- `npm run aws:dev-uat:operator-handoff:check`
- `npm run aws:dev-uat:operator-handoff:fixture:check`
- `npm run aws:dev-uat:final-readiness:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:operator-handoff:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- handoff が実 AWS 実行を開始しないこと。
- 承認必須の外部状態変更が pending / requires_confirmation のまま残ること。
- 実 AWS 未実行を完了扱いにしていないこと。

## リスク

- handoff は実行前の操作引き継ぎ artifact であり、実 AWS dev/UAT 実行の代替ではない。

## 完了メモ

- 実装commit: `3ba8da7f398959d3cd4f4d63447be6c6da180676`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561376478
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561377632
- 作業レポート: `reports/working/20260528-1523-aws-operator-handoff.md`

### 実行した検証

- `npm run aws:dev-uat:operator-handoff:check`: pass
- `npm run aws:dev-uat:operator-handoff:fixture:check`: pass
- `npm run aws:dev-uat:final-readiness:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `task aws:dev-uat:operator-handoff:fixture:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass

### 未実施・制約

- `aws sts get-caller-identity --output json`: fail。AWS credentials 未設定のため、実 AWS dev/UAT 実行、Flyway 実適用、E2E、性能、RAG品質評価、実 evidence 作成は未実施。
