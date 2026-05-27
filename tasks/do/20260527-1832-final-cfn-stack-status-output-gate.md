# final CloudFormation stack status output gate

状態: doing

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-081 は、検収環境の CloudFormation outputs/inventory が基本設計に定義した主要リソースと一致することを求めている。`tools/cloudformation-inventory.js` の final capture instructions も `StackStatus` と `Outputs` を required evidence として列挙している。一方、現状の final evidence candidate validator は final CloudFormation inventory の stack status と outputs の存在を検査していない。

## 目的

final evidence candidate の CloudFormation inventory 検査で、successful な stack status と non-empty outputs を持たない final inventory を invalid として検出し、不十分な CloudFormation 証跡で AC-081 / AC-150 / AC-151 / AC-152 を満たした扱いにしない。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、final CloudFormation inventory に `stack_status` や outputs がなくても、source / eligibility / resource type checks を満たせば ready になり得る。

### 確認済み事実

- `tools/cloudformation-inventory.js` の `final_capture_instructions.required_for_acceptance` は `StackStatus` と `Outputs` を列挙している。
- `tools/final-evidence-candidate.js` は `inventory.source === "aws-cloudformation-inventory"` を検査している。
- `tools/final-evidence-candidate.js` は `inventory.final_acceptance_eligible === true` と `aws_capture_required === false` を検査している。
- `tools/final-evidence-candidate.js` は major resource type 網羅を検査している。
- `tools/final-evidence-candidate.js` は stack status が complete 系であることを検査していない。
- `tools/final-evidence-candidate.js` は outputs が 1 件以上あることを検査していない。

### 推定原因

- CloudFormation preflight は段階的に source / manifest consistency / resource type coverage を追加してきたため、capture instruction の `StackStatus` / `Outputs` が validator に未反映だった。
- fixture の ready inventory が stack status と outputs を持たない形から開始していた。

### 根本原因

- final capture instructions と final candidate validator の不変条件が完全に同期していなかった。
- successful stack status / outputs 欠落を拒否する regression fixture が不足していた。

### 影響範囲

- final evidence candidate validator。
- final evidence candidate fixture。
- CloudFormation inventory schema documentation。
- AC-081 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の CloudFormation inventory 確認観点。

### 対策

- final CloudFormation inventory の `stack_status` が complete 系 status であることを検査する。
- final CloudFormation inventory の `stack_outputs` が array かつ 1 件以上であることを検査する。
- CloudFormation inventory schema に final normalized fields として `stack_status` / `stack_outputs` / `stack_resources` を追記する。
- valid fixture に status / outputs を追加し、invalid fixture で失敗 status と empty outputs を検出する。
- runbook に stack status / outputs の確認観点を追記する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/acceptance/cloudformation/cloudformation_inventory.schema.json`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - AWS CloudFormation `describe-stacks` / `list-stack-resources` の実行
  - AWS deploy / publish
  - final evidence manifest の作成
  - final checklist signoff

## 実装計画

1. final candidate validator で `stack_status` と `stack_outputs` を検査する。
2. fixture の ready inventory に successful stack status と outputs を追加する。
3. invalid stack status / empty outputs fixture を追加する。
4. CloudFormation inventory schema と final acceptance runbook を更新する。
5. 検証結果と PR コメント URL を task に記録する。

## ドキュメント保守計画

- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` に final normalized inventory fields を追記する。
- `docs/ops/runbooks/final-acceptance.md` に stack status / outputs の確認観点を追記する。

## 受け入れ条件

- [x] final CloudFormation inventory の `stack_status` が complete 系の場合、valid fixture は ready と判定される。
- [x] final CloudFormation inventory の `stack_status` が failed / rollback 系の場合、validator が invalid として検出する。
- [x] final CloudFormation inventory の `stack_outputs` が空の場合、validator が invalid として検出する。
- [x] 既存の major resource type / manifest consistency checks を弱めない。
- [x] 外部状態を変更せず、release / AWS / final signoff の pending 状態を維持する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run cfn:inventory:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run cfn:inventory:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/acceptance/cloudformation/cloudformation_inventory.schema.json docs/ops/runbooks/final-acceptance.md tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1832-final-cfn-stack-status-output-gate.md reports/working/20260527-1835-final-cfn-stack-status-output-gate.md`: pass

## PR コメント

- 未投稿。PR push 後に受け入れ条件確認とセルフレビューを記録する。

## PR レビュー観点

- final capture instructions の `StackStatus` / `Outputs` が validator と schema に反映されているか。
- CloudFormation inventory の source / eligibility / manifest consistency / major resource checks を弱めていないか。
- 外部状態変更が含まれていないか。

## リスク

- final normalized inventory の field 名を `stack_status` / `stack_outputs` としているため、実取得正規化手順もこの名前に合わせる必要がある。
