# CloudFormation inventory source schema gate

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-081 は、検収環境の CloudFormation outputs/inventory が基本設計に定義した主要リソース種別と個数に一致することを求めている。final evidence candidate validator は AWS 取得後の normalized final inventory として `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` を検査する。

現状の `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` は draft inventory 用の `local_cdk_inventory` と `final_capture_instructions` を常時 required としている。一方、final candidate validator は AWS 取得後の final inventory では `stack_id` / `stack_status` / `stack_outputs` / `stack_resources` を required evidence として扱うため、schema と final validator の source 別必須条件が一致していない。

## 目的

CloudFormation inventory schema を `source` 別の draft/final 形状に同期し、local draft inventory と AWS final inventory のどちらも正しい required evidence を持つことを schema と check で説明・検出できるようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の CloudFormation inventory schema は、AWS final inventory source でも draft 専用 field を required としており、final candidate validator が要求する AWS final evidence field を schema の required 条件として表現していない。

### 確認済み事実

- `tools/final-evidence-candidate.js` は `source === "aws-cloudformation-inventory"` を final inventory の条件としている。
- `tools/final-evidence-candidate.js` は `stack_id` / `stack_status` / `stack_outputs` / `stack_resources` を final inventory の検査対象としている。
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` は `local_cdk_inventory` と `final_capture_instructions` を top-level `required` に含めている。
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` は `stack_id` / `stack_status` / `stack_outputs` / `stack_resources` を optional properties としている。
- `tools/check-cloudformation-inventory.js` は draft inventory の local CDK intent 検査に寄っており、schema が source 別 required 条件を持つことを検査していない。

### 推定原因

- CloudFormation inventory は local preflight draft から開始し、その後 final AWS inventory の validator が段階的に追加されたため、schema の required 条件が draft 前提のまま残った。
- `stack_status` / `stack_outputs` / `stack_resources` の validator 強化時に、schema での source 別 required 条件と static check が同時に更新されなかった。

### 根本原因

- CloudFormation inventory の schema が `source` に応じた draft/final contract を明示していなかった。
- schema と final candidate validator の同期を検出する static check が不足していた。

### 影響範囲

- CloudFormation inventory schema documentation。
- `npm run cfn:inventory:check` の schema contract inspection。
- final AWS inventory 作成者が参照する normalized inventory 形状。
- AC-081 / AC-150 / AC-151 / AC-152 の final evidence preflight。

### 対策

- CloudFormation inventory schema の top-level required を共通 field に限定する。
- `allOf` と `if` / `then` で `source: local-cdk-intent` の場合は draft fields を required にする。
- `allOf` と `if` / `then` で `source: aws-cloudformation-inventory` の場合は final evidence fields を required にする。
- `stack_outputs` / `stack_resources` に `minItems: 1` を持たせる。
- `tools/check-cloudformation-inventory.js` で source 別 schema 条件を検査する。

## スコープ

- 対象:
  - `docs/acceptance/cloudformation/cloudformation_inventory.schema.json`
  - `tools/check-cloudformation-inventory.js`
  - `reports/working/`
  - 本 task md
- 対象外:
  - AWS CloudFormation `describe-stacks` / `list-stack-resources` の実行
  - final inventory file の作成
  - Git tag / GitHub Release / final checklist signoff

## 実装計画

1. CloudFormation inventory schema を common required + source conditional required へ更新する。
2. `stack_outputs` / `stack_resources` の `minItems` を明記する。
3. `check-cloudformation-inventory.js` に source conditional schema の static inspection を追加する。
4. 関連 acceptance / docs / verify checks を実行する。
5. 作業レポート、commit、push、PR コメントまで反映する。

## ドキュメント保守計画

- CloudFormation inventory schema 自体を更新する。
- final acceptance runbook は既に stack status / outputs / resources を確認観点として記載済みのため、今回の変更で追加更新が必要か確認する。

## 受け入れ条件

- [x] CloudFormation inventory schema が common required と source 別 required を区別している。
- [x] `source: local-cdk-intent` の schema 条件が `local_cdk_inventory` と `final_capture_instructions` を required としている。
- [x] `source: aws-cloudformation-inventory` の schema 条件が `stack_id` / `stack_status` / `stack_outputs` / `stack_resources` を required としている。
- [x] `stack_outputs` / `stack_resources` が空配列では final schema として不足であることを schema 上も表現している。
- [x] 既存の local CloudFormation inventory draft check と final evidence candidate fixture check を弱めない。
- [x] 外部状態を変更せず、release / AWS / final signoff の pending 状態を維持する。

## Done 条件

- [x] 実装差分が PR branch に commit / push されている。
- [x] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [x] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [x] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run cfn:inventory:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run cfn:inventory:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run docs:check`: pass
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553416800
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553420248
- GitHub Apps comment は既知の 403 `Resource not accessible by integration` のため、`gh pr comment` fallback で投稿した。

## PR レビュー観点

- schema が draft/final source ごとの contract を正しく表現しているか。
- final candidate validator が要求する field と schema の required 条件が同期しているか。
- local draft inventory の既存検査を弱めていないか。
- 外部状態変更が含まれていないか。

## リスク

- JSON Schema draft 2020-12 の conditional を追加するため、将来 schema validator を導入する場合に `allOf` / `if` / `then` の解釈差に注意が必要。
