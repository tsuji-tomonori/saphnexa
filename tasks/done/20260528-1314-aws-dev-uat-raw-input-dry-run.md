# AWS dev/UAT raw input dry-run checker

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

AWS dev/UAT の raw input scaffold は生成できるようになったが、operator が実 AWS 値を埋めた raw input を final evidence として `dist/acceptance/` に書き出す前に、同じ厳しさで dry-run 検査する導線がない。

## 目的

preflight / validation raw input を一時ディレクトリで evidence build し、既存 final gate 相当の検査を通せるか確認する checker を追加する。scaffold や `pending_capture` の raw input は reject し、実 AWS 証跡の投入前に不備を発見できるようにする。

## スコープ

- raw input dry-run checker CLI を追加する。
- sample raw input の positive path と scaffold rejection の fixture check を追加する。
- npm scripts、Taskfile、CI、verify、external action plan、docs に反映する。
- 実 AWS deploy、実 raw output 取得、final evidence 生成はこのタスクでは行わない。

## 実施計画

1. 既存 evidence builder / final checker の契約を確認する。
2. raw input dry-run checker と fixture checker を追加する。
3. package scripts、Taskfile、CI、docs check、external action plan、verify に組み込む。
4. runbook と local verification docs を更新する。
5. targeted checks、`npm run verify`、AWS STS probe を実行して結果を記録する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に dry-run 手順を追記する。
- `docs/ops/local-verification.md` に dry-run fixture check の意味と制約を追記する。

## 受け入れ条件

- [ ] `node tools/check-aws-dev-uat-raw-input.js preflight --input <raw-preflight-input.json>` が一時 evidence build と final preflight gate を実行できる。
- [ ] `node tools/check-aws-dev-uat-raw-input.js validation --input <raw-validation-input.json>` が一時 evidence build と validation suite final gate を実行できる。
- [ ] scaffold / `pending_capture` の raw input は dry-run checker で reject される。
- [ ] `npm run aws:dev-uat:raw-input:fixture:check` で sample raw input の positive path と scaffold rejection を検査できる。
- [ ] `npm run verify`、CI workflow、Taskfile、external acceptance actions、docs check に dry-run checker が反映される。
- [ ] runbook と local verification docs に dry-run 手順と制約が記載される。

## 検証計画

- `npm run aws:dev-uat:raw-input:fixture:check`
- `npm run aws:dev-uat:raw-input-scaffold:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:raw-input:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- dry-run が final evidence を `dist/acceptance/` に書かないこと。
- scaffold や未捕捉 raw input を final-ready と誤認しないこと。
- 既存 final checker の閾値と RAG/性能/E2E 条件を弱めていないこと。

## リスク

- 実 AWS credentials がない場合、dry-run fixture は通っても実 AWS dev/UAT 検証完了の証跡にはならない。
- operator が実 raw output 本体を保存していない場合、dry-run は `output_ref` file missing で fail する。
