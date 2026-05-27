# final manifest CloudFormation stack account gate

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-001 は、検収対象の AWS account、region、CDK deploy 対象 environment を証跡 manifest に記録することを求めている。AC-081 は、検収環境の CloudFormation inventory と主要 resource が一致することを求めている。現状の final evidence candidate validator は manifest の `cloudformation_stacks` が空でないことと、`stack_id` が `ap-northeast-1` の CloudFormation ARN 形式であることを検査するが、manifest に列挙された全 stack の account/region/name が manifest 自身の `aws_account_id` / `aws_region` / `stack_name` と整合することまでは検査していない。

## 目的

final evidence candidate の manifest 検査で、別 AWS account や別 region の CloudFormation stack ARN、または stack ARN 内の stack name と `stack_name` が一致しない行を invalid として検出し、誤った stack 証跡で AC-001 / AC-081 を満たした扱いにしない。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、`cloudformation_stacks` に別 AWS account の stack ARN や、`stack_name` と ARN 内 stack name が一致しない stack が混入しても、少なくとも CloudFormation inventory と一致する stack が別にあれば ready になり得る。

### 確認済み事実

- `tools/final-evidence-candidate.js` は `manifest.aws_account_id` が実 12 桁であることを検査している。
- `tools/final-evidence-candidate.js` は `manifest.aws_region === "ap-northeast-1"` を検査している。
- `tools/final-evidence-candidate.js` は各 `stack.stack_id` が `arn:aws:cloudformation:ap-northeast-1:<account>:stack/` で始まることを検査している。
- `tools/final-evidence-candidate.js` は CloudFormation inventory の `stack_id` が manifest の `cloudformation_stacks` に含まれることを検査している。
- `tools/final-evidence-candidate.js` は manifest に列挙された全 stack の ARN account が `manifest.aws_account_id` と一致することを検査していない。
- `tools/final-evidence-candidate.js` は manifest に列挙された全 stack の ARN stack name が `stack.stack_name` と一致することを検査していない。

### 推定原因

- 最初の CloudFormation consistency check は final inventory 1件との整合性を優先し、manifest 配列全体の正規性チェックが後続課題として残った。
- fixture は inventory mismatch を扱う一方、manifest 内の追加 stack の account/name mismatch を扱っていなかった。

### 根本原因

- manifest の `cloudformation_stacks` 配列を「最終証跡の全 stack 一覧」としてではなく、「inventory と一致する stack を含む一覧」として検査していた。
- stack ARN から region/account/name を構造化して、manifest の値と照合する不変条件が不足していた。

### 影響範囲

- final evidence candidate validator。
- AC-001 / AC-002 / AC-081 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の manifest/CloudFormation 照合観点。

### 対策

- manifest 内の各 CloudFormation stack ARN を parse し、region/account/name を検査する。
- 各 stack の region は `manifest.aws_region`、account は `manifest.aws_account_id`、ARN 内 stack name は `stack.stack_name` と一致させる。
- fixture に別 account stack と stack name mismatch を含む invalid ケースを追加する。
- runbook に manifest 内の全 stack が account/region/name で整合することを追記する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - AWS CloudFormation `describe-stacks` / `list-stack-resources` の実行
  - AWS deploy / publish
  - final evidence manifest の作成
  - final checklist signoff

## 実装計画

1. manifest の `cloudformation_stacks` loop で stack ARN を parse する。
2. 各 stack の ARN region/account/name と manifest の値を照合する。
3. fixture に manifest stack account/name mismatch ケースを追加する。
4. final acceptance runbook に照合観点を追記する。
5. 検証結果と PR コメント URL を task に記録する。

## ドキュメント保守計画

- `docs/ops/runbooks/final-acceptance.md` に、manifest の全 CloudFormation stack が account/region/name で整合することを追記する。

## 受け入れ条件

- [x] manifest の `cloudformation_stacks` に `aws_account_id` と異なる account の stack ARN が含まれる場合、validator が invalid として検出する。
- [x] manifest の `cloudformation_stacks` に `aws_region` と異なる region の stack ARN が含まれる場合、validator が invalid として検出する。
- [x] manifest の `cloudformation_stacks` に `stack_name` と ARN 内 stack name が一致しない行が含まれる場合、validator が invalid として検出する。
- [x] valid fixture は引き続き ready と判定される。
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
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1807-final-manifest-cfn-stack-account-gate.md reports/working/20260527-1809-final-manifest-cfn-stack-account-gate.md`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553132994
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553135720
- GitHub Apps comment は既に 403 `Resource not accessible by integration` を確認済みのため、`gh pr comment` で代替した。

## PR レビュー観点

- manifest 内の全 stack に対して account/region/name の整合性を検査しているか。
- 既存の final inventory と manifest の整合性検査を弱めていないか。
- 外部状態変更が含まれていないか。

## リスク

- 複数 stack を扱う最終 manifest では、すべての stack ARN が同じ UAT account/region であることが必須になる。複数 account 検収を将来許容する場合は、受入条件と validator の拡張が必要。
