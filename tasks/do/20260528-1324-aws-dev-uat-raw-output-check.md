# AWS dev/UAT raw output content checker

- 状態: doing
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

AWS dev/UAT の raw input dry-run は追加済みだが、`capture_provenance.commands[].output_ref` が指す raw output 本体の形式検査は builder の存在確認に寄っている。実 AWS 実行時に JSON と text の取り違えや空ファイルが混入すると、final evidence 作成前の原因切り分けが遅れる。

## 目的

raw input に紐づく raw output files を、preflight / validation の command id ごとの期待形式で検査する。JSON output は parse 可能で空でないこと、text output は空でないことを final evidence 作成前に確認できるようにする。

## スコープ

- raw output content checker CLI を追加する。
- sample raw input / raw output の fixture check を追加する。
- npm scripts、Taskfile、CI、verify、external action plan、docs に組み込む。
- 実 AWS command 実行や raw output 取得はこのタスクでは行わない。

## 実施計画

1. 既存 raw input / raw capture plan / evidence builder の契約を確認する。
2. raw output content checker と fixture check を追加する。
3. package scripts、Taskfile、CI、docs check、external action plan、verify に組み込む。
4. runbook と local verification docs を更新する。
5. targeted checks、`npm run verify`、AWS STS probe を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に raw output content check を追記する。
- `docs/ops/local-verification.md` に fixture check の意味と制約を追記する。

## 受け入れ条件

- [ ] `node tools/check-aws-dev-uat-raw-output.js preflight --input <raw-preflight-input.json>` で preflight raw output の JSON/text 形式を検査できる。
- [ ] `node tools/check-aws-dev-uat-raw-output.js validation --input <raw-validation-input.json>` で validation raw output の JSON/text 形式を検査できる。
- [ ] JSON output は parse 不能または空 JSON の場合 fail する。
- [ ] text output は空の場合 fail する。
- [ ] `npm run aws:dev-uat:raw-output:fixture:check` で sample raw output と negative path を検査できる。
- [ ] `npm run verify`、CI workflow、Taskfile、external acceptance actions、docs check に raw output checker が反映される。
- [ ] runbook と local verification docs に raw output content check の手順と制約が記載される。

## 検証計画

- `npm run aws:dev-uat:raw-output:fixture:check`
- `npm run aws:dev-uat:raw-input:fixture:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `task aws:dev-uat:raw-output:fixture:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json`

## PRレビュー観点

- raw output content checker が AWS command を実行しないこと。
- sample fixture は最終検収 evidence として扱わないこと。
- `output_ref` の traversal / absolute path を許可しないこと。

## リスク

- content checker は形式・空ファイル検査であり、実 AWS 操作の成功や性能/RAG品質の合格を単独で証明しない。
- 実 AWS credentials がない場合、最終的な AWS dev/UAT 検証は引き続き未完了。
