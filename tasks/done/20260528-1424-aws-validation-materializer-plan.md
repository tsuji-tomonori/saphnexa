# AWS dev/UAT validation materializer plan

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

validation raw input materializer は追加済みだが、`aws_dev_uat_raw_capture_plan.json` の validation mode には raw output capture 後に materializer を実行する command が明示されていない。
runbook と external action plan だけに materializer command がある状態では、operator が機械生成 plan を主導線にしたときに、scaffold から final validation raw input を作る工程を見落とす可能性がある。

## 目的

AWS dev/UAT raw capture plan と raw input scaffold に validation raw input materializer command を含め、実行済み raw output files から final validation raw input を作ってから raw output/input check と validation build/final gate へ進む手順を機械可読にする。

## スコープ

- validation mode の raw capture plan に `materialize_command` を追加する。
- scaffold の operator notes に materializer 実行を明記する。
- raw capture plan / scaffold checker で materializer command と順序を検査する。
- runbook、local verification、docs/CI check を必要に応じて同期する。
- 実 AWS E2E、負荷試験、RAG品質評価はこのタスクでは実行しない。

## 実施計画

1. 既存 raw capture plan と scaffold の validation mode を確認する。
2. materializer command を plan に追加し、checker で必須化する。
3. scaffold の operator note と docs/checker を同期する。
4. targeted checks と `npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` に不足があれば同期する。
- `tools/check-docs.js` で doc と script の同期を検査する。

## 受け入れ条件

- [x] validation raw capture plan が materializer command を明示する。
- [x] materializer command が validation raw output capture 後、raw output/input check と validation build 前の導線として検査される。
- [x] validation scaffold の operator notes が materializer 実行と scaffold 非 final evidence を明示する。
- [x] raw capture plan / scaffold / docs / CI check が materializer command を要求する。
- [x] 実 AWS dev/UAT 検証を完了扱いにしない。

## 検証計画

- `npm run aws:dev-uat:raw-capture-plan:check`
- `npm run aws:dev-uat:raw-input-scaffold:check`
- `npm run aws:dev-uat:validation-raw-input:fixture:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- raw capture plan と external action plan / runbook の実行順が矛盾しないこと。
- materializer が実 AWS 実行済み raw output の組み立てだけを担い、未実行の検証を成功扱いしないこと。
- sample / fixture が final evidence と混同されないこと。

## リスク

- materializer command は plan に記載されるだけで、plan build/check は外部コマンドを実行しない。

## 完了メモ

- 実装コミット: `f94c08d`
- PR 受け入れ条件コメント: `https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561086766`
- PR セルフレビューコメント: `https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561089597`
- 主な検証: `npm run verify`、`npm run aws:dev-uat:raw-capture-plan:check`、`npm run aws:dev-uat:raw-input-scaffold:check`、`git diff --check` pass。
- 制約: AWS credentials がないため、実 AWS dev/UAT 検証は未実施。
