# final CloudFormation manifest consistency gate

状態: do

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-002 は成果物一式の提出、AC-081 は CloudFormation inventory の実取得を求めている。現状の final evidence candidate validator は `docs/acceptance/final/evidence_manifest.json` と `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` をそれぞれ検査するが、両者が同じ AWS account、region、stack を指すことまでは検査していない。

## 目的

final evidence candidate の検査で、manifest と CloudFormation inventory の AWS account / region / environment / stack name / stack ARN が不一致の場合を検出し、別環境や別 stack の証跡を組み合わせた状態で最終検収 ready にならないようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、manifest と CloudFormation inventory が個別には妥当でも、互いに異なる AWS account、region、stack を指す場合に検出できない。

### 確認済み事実

- `tools/final-evidence-candidate.js` は manifest の `aws_account_id`、`aws_region`、`cloudformation_stacks[].stack_id` を検査している。
- `tools/final-evidence-candidate.js` は inventory の `source`、`final_acceptance_eligible`、`aws_capture_required`、`stack_id`、`stack_resources` を検査している。
- manifest と inventory の `stack_id`、`stack_name`、`aws_region`、`environment`、account id の一致は検査していない。
- AC-002/AC-081 は同一の検収環境に紐づく成果物・CloudFormation 証跡の提出を期待している。

### 推定原因

- validator が manifest と inventory を独立した証跡ファイルとして追加したため、ファイル間の相互整合性チェックが後続課題として残った。
- fixture も単体ファイルの ready/invalid を主に扱い、別環境証跡の組み合わせを検査していなかった。

### 根本原因

- final evidence candidate の「証跡セット全体が同一環境を指すこと」という不変条件が validator に明示されていなかった。
- cross-file consistency を表す fixture が不足していた。

### 影響範囲

- final evidence candidate validator。
- AC-002 / AC-081 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の証跡確認手順。

### 対策

- manifest と inventory の system / environment / region / account / stack name / stack id の一致検査を追加する。
- fixture で inventory の account / stack mismatch を作り、validator が invalid にすることを検査する。
- runbook に manifest と CloudFormation inventory が同一 UAT stack を指すことを明記する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - AWS CloudFormation の実取得
  - AWS deploy / publish
  - final evidence files の作成
  - final checklist signoff

## 実装計画

1. manifest / inventory の検査結果を cross-file consistency check に渡せるようにする。
2. CloudFormation stack ARN から account / region を取り出す helper を追加する。
3. manifest と inventory の system / environment / region / account / stack name / stack id 一致を検査する。
4. fixture に inventory mismatch ケースを追加する。
5. runbook と task に検証結果を記録する。

## ドキュメント保守計画

- `docs/ops/runbooks/final-acceptance.md` に、manifest と CloudFormation inventory が同じ AWS account / region / stack を指すことを追記する。

## 受け入れ条件

- [x] manifest と inventory の AWS account が不一致の場合、validator が invalid として検出する。
- [x] manifest と inventory の stack name または stack id が不一致の場合、validator が invalid として検出する。
- [x] valid fixture は引き続き ready と判定される。
- [x] runbook が manifest と CloudFormation inventory の同一環境・同一 stack 要件を明記する。
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
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1733-final-cfn-manifest-consistency.md`: pass

## PR レビュー観点

- manifest と inventory の cross-file mismatch を確実に検出しているか。
- 既存の単体 manifest / inventory checks を弱めていないか。
- fixture が ready / mismatch の両方をカバーしているか。
- 外部状態変更が含まれていないか。

## リスク

- CloudFormation stack ARN 形式が想定外の場合は invalid になる。最終検収では AWS `describe-stacks` 由来の標準 ARN を提出する前提。
- 複数 stack を採用する場合、inventory がどの stack を代表するかのルール追加が必要になる可能性がある。
