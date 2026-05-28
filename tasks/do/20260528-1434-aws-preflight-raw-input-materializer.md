# AWS dev/UAT preflight raw input materializer

- 状態: doing
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

validation raw input は raw output files と scaffold から自動生成できるが、preflight raw input はまだ operator が CloudFormation outputs、Flyway、OpenAPI、Edge/RAG/Admin artifact smoke の結果を手作業で転記する前提になっている。
preflight は 1〜6 の実装が AWS dev/UAT に結合済みであることを証明する入口なので、手作業転記を残すと final validation 前の誤記や抜けが起きやすい。

## 目的

preflight raw output files と scaffold から final preflight raw input を生成する materializer を追加し、DSQL/Flyway、Hono/OpenAPI、CloudFormation、CloudFront/Cognito/AppSync Events、Bedrock KB/S3 Vectors/AgentCore、Docusaurus/Allure の実 captured values を機械的に evidence builder へ渡せるようにする。

## スコープ

- preflight raw input materializer CLI と fixture check を追加する。
- materializer は scaffold と preflight raw output files を読み、`captured_at`、source、AWS account、CloudFormation outputs、Flyway、OpenAPI、Edge/RAG/Admin artifact smoke、capture provenance を final raw input に反映する。
- raw capture plan と preflight scaffold に materializer command と finalization order を追加する。
- sample preflight raw output を materializer fixture で final gate まで進められる形に更新する。
- external action plan、runbook、local verification、package scripts、Taskfile、CI/verify、docs check に反映する。
- 実 AWS deploy、Flyway apply、E2E、負荷試験、RAG品質評価はこのタスクでは実行しない。

## 実施計画

1. preflight raw input / evidence builder の入力形と raw output checker を確認する。
2. preflight materializer と fixture check を追加する。
3. raw capture plan、scaffold、sample raw output、docs/action plan/scripts/checks を同期する。
4. targeted checks、`npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に preflight materializer 手順を追記する。
- `docs/ops/local-verification.md` に fixture check と制約を追記する。

## 受け入れ条件

- [ ] preflight raw output files と scaffold から preflight raw input を生成できる。
- [ ] 生成 raw input は raw output check、raw input dry-run、preflight evidence build/final gate に進められる。
- [ ] raw capture plan と preflight scaffold が preflight materializer command と finalization order を持つ。
- [ ] fixture check が positive path と missing raw output / CloudFormation output missing / Flyway checksum failure の negative path を検査する。
- [ ] external action plan、runbook、local verification、CI/verify/Taskfile/docs check に preflight materializer が反映される。

## 検証計画

- `npm run aws:dev-uat:preflight-raw-input:fixture:check`
- `npm run aws:dev-uat:raw-capture-plan:check`
- `npm run aws:dev-uat:raw-input-scaffold:check`
- `npm run aws:dev-uat:raw-output:fixture:check`
- `npm run aws:dev-uat:raw-input:fixture:check`
- `npm run aws:dev-uat:evidence:fixture:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- materializer が sample fallback や架空成功を作らないこと。
- CloudFormation outputs、Flyway checksum、OpenAPI route count、smoke helper statuses の不足や失敗を成功として転記しないこと。
- 実 AWS 未実行を完了扱いにしていないこと。

## リスク

- materializer は取得済み raw output の組み立てを自動化するだけで、AWS deploy、migration、publish、smoke 実行は開始しない。
