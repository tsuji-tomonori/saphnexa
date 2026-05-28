# AWS dev/UAT validation raw input materializer

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

AWS dev/UAT validation の raw output capture helper は整備済みだが、取得済み raw output から `aws_dev_uat_validation.raw.json` を組み立てる工程は operator の手作業に残っている。
手作業転記では、metric 名の対応、Allure URL、CloudFront access log URI、Bedrock Evaluation Job ARN、provenance command の同期にミスが入りやすい。

## 目的

validation raw output files と raw input scaffold から final validation raw input を生成する materializer を追加し、E2E・性能・RAG品質の実行済み結果を機械的に evidence builder へ渡せるようにする。

## スコープ

- validation raw input materializer CLI と fixture check を追加する。
- materializer は scaffold と raw output files を読み、`captured_at`、source、aws account、E2E、性能、RAG品質、capture provenance を final raw input に反映する。
- sample validation raw input の provenance command を capture helper ベースへ更新する。
- external action plan、runbook、local verification、package scripts、Taskfile、CI/verify、docs check に反映する。
- 実 AWS E2E、負荷試験、Bedrock Evaluations の実行そのものはこのタスクでは行わない。

## 実施計画

1. 既存 raw input scaffold、raw output checker、validation evidence builder の入力形を確認する。
2. validation materializer と fixture check を追加する。
3. sample raw input と docs/action plan/scripts/checks を同期する。
4. targeted checks、`npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に materializer 手順を追記する。
- `docs/ops/local-verification.md` に fixture check と制約を追記する。

## 受け入れ条件

- [x] raw output files と scaffold から validation raw input を生成できる。
- [x] 生成 raw input は raw output check、raw input dry-run、validation evidence build/final gate に進められる。
- [x] sample validation raw input の provenance command が validation capture helper ベースになっている。
- [x] fixture check が positive path と missing raw output / threshold mapping failure の negative path を検査する。
- [x] external action plan、runbook、local verification、CI/verify/Taskfile/docs check に materializer が反映される。

## 検証計画

- `npm run aws:dev-uat:validation-raw-input:fixture:check`
- `npm run aws:dev-uat:raw-output:fixture:check`
- `npm run aws:dev-uat:raw-input:fixture:check`
- `npm run aws:dev-uat:validation:fixture:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:validation-raw-input:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- materializer が sample fallback や架空成功を作らないこと。
- raw output の閾値未達を raw input に成功として転記しないこと。
- 実 AWS 未実行を完了扱いにしていないこと。

## リスク

- materializer は取得済み raw output の組み立てを自動化するだけで、実 E2E・性能・RAG品質評価を開始しない。

## 完了メモ

- 実装コミット: `860330f`
- PR 受け入れ条件コメント: `https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561045972`
- PR セルフレビューコメント: `https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561048655`
- 主な検証: `npm run verify`、`task aws:dev-uat:validation-raw-input:fixture:check`、`git diff --check` pass。
- 制約: AWS credentials がないため、実 AWS dev/UAT 検証は未実施。
