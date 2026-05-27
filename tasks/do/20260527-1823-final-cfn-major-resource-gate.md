# final CloudFormation major resource gate

状態: doing

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-081 は、基本設計に定義した主要リソース種別と個数が検収環境の CloudFormation outputs/inventory と一致することを求めている。現状の final evidence candidate validator は final CloudFormation inventory が AWS CloudFormation 由来であることと `stack_resources` が 1 件以上あることを検査するが、主要リソース種別が網羅されていることまでは検査していない。

## 目的

final evidence candidate の CloudFormation inventory 検査で、主要 resource type が不足している final inventory を invalid として検出し、不十分な CloudFormation 証跡で AC-081 / AC-150 / AC-151 / AC-152 を満たした扱いにしない。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、`stack_resources` に 1 件以上の resource があれば、主要 resource type が欠落していても CloudFormation inventory 検査を通過し得る。

### 確認済み事実

- `tools/final-evidence-candidate.js` は `inventory.source === "aws-cloudformation-inventory"` を検査している。
- `tools/final-evidence-candidate.js` は `inventory.final_acceptance_eligible === true` と `aws_capture_required === false` を検査している。
- `tools/final-evidence-candidate.js` は `inventory.stack_resources` が array かつ 1 件以上であることを検査している。
- `tools/final-evidence-candidate.js` は `expectedMajorResourceTypes` の全 type が `stack_resources[].ResourceType` に含まれることを検査していない。
- `tools/cloudformation-inventory.js` には local CDK intent 由来の `expectedMajorResourceTypes` が定義済みである。

### 推定原因

- final candidate validator の初期実装では、CloudFormation 実取得ファイルと manifest との基本整合性を優先し、主要 resource type 網羅までは後続課題として残った。
- fixture の ready inventory が最小の Lambda 1 件だけでも ready になる形で作られていた。

### 根本原因

- AC-081 の「主要リソース種別一致率 100%」を、final candidate validator の不変条件として明示していなかった。
- CloudFormation inventory fixture が主要 resource type 欠落を検出する regression case を持っていなかった。

### 影響範囲

- final evidence candidate validator。
- final evidence candidate fixture。
- AC-081 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の CloudFormation inventory 確認観点。

### 対策

- final CloudFormation inventory の `stack_resources[].ResourceType` が `expectedMajorResourceTypes` を全件含むことを検査する。
- valid fixture の `stack_resources` を expected major resource types 全件に広げる。
- major resource type が不足している invalid fixture を追加する。
- runbook に主要 resource type の網羅条件を追記する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - AWS CloudFormation `list-stack-resources` の実行
  - AWS deploy / publish
  - final evidence manifest の作成
  - final checklist signoff

## 実装計画

1. final candidate validator で `expectedMajorResourceTypes` の網羅を検査する。
2. fixture の ready inventory を主要 resource type 全件に対応させる。
3. missing major resource type fixture を追加する。
4. final acceptance runbook に確認観点を追記する。
5. 検証結果と PR コメント URL を task に記録する。

## ドキュメント保守計画

- `docs/ops/runbooks/final-acceptance.md` に、final CloudFormation inventory が主要 resource type を全件含むことを追記する。

## 受け入れ条件

- [x] final CloudFormation inventory の `stack_resources[].ResourceType` が主要 resource type を全件含む場合、valid fixture は ready と判定される。
- [x] final CloudFormation inventory の主要 resource type が不足する場合、validator が invalid として検出する。
- [x] 既存の manifest / inventory account・region・stack 整合性検査を弱めない。
- [x] 外部状態を変更せず、release / AWS / final signoff の pending 状態を維持する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1823-final-cfn-major-resource-gate.md reports/working/20260527-1825-final-cfn-major-resource-gate.md`: pass

## PR コメント

- 未投稿。PR push 後に受け入れ条件確認とセルフレビューを記録する。

## PR レビュー観点

- expected major resource types と final inventory の actual resource types を正しく照合しているか。
- CloudFormation inventory の source / eligibility / manifest consistency checks を弱めていないか。
- 外部状態変更が含まれていないか。

## リスク

- `expectedMajorResourceTypes` が CDK intent とずれた場合、final inventory が正しくても invalid になる可能性がある。その場合は CDK intent と受入条件側を同時に更新する必要がある。
