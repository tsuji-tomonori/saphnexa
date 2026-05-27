# final cfn resource detail gate

- 状態: done
- タスク種別: 機能追加
- 対象PR: #1

## 背景

Saphnexa の final acceptance では、CloudFormation outputs/inventory が検収環境の証跡として提出され、基本設計の主要リソース種別と一致する必要がある。現在の final candidate validator は主要 `ResourceType` の存在を検査しているが、`list-stack-resources` 由来の各 resource が `LogicalResourceId`、`PhysicalResourceId`、`ResourceType`、`ResourceStatus` を持つことまでは検査していない。

## 目的

CloudFormation final inventory が resource detail を欠いたまま final ready になることを防ぎ、AC-081 の証跡検査を強化する。

## スコープ

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json`
- 必要に応じた inventory check / runbook 同期
- 作業レポート

## 対象外

- AWS への deploy / publish
- CloudFormation `describe-stacks` / `list-stack-resources` の実行
- Git tag / GitHub release 作成
- final checklist 署名

## 計画

1. final candidate validator に CloudFormation resource detail 検査を追加する。
2. ready fixture に complete resource status を追加する。
3. resource detail 欠落 fixture が invalid になることを追加検証する。
4. CloudFormation inventory schema と関連 check / runbook の同期要否を確認する。
5. acceptance と repository 検証を実行する。
6. レポート、commit、push、PR コメントを行う。

## ドキュメントメンテナンス方針

CloudFormation inventory schema は final inventory の提出形式を表すため、`stack_resources` item の必須 field を更新する。運用 runbook に final resource detail の検査観点が不足する場合は、最小限で追記する。

## 受け入れ条件

- [x] final candidate validator が `stack_resources` の `LogicalResourceId`、`PhysicalResourceId`、`ResourceType`、`ResourceStatus` を検査する。
- [x] final candidate validator が complete 系 resource status だけを受け入れる。
- [x] ready fixture が complete resource status を含み、`npm run acceptance:final-candidate:fixture:check` が pass する。
- [x] resource detail 欠落 fixture が invalid になり、該当 error label を検査する。
- [x] schema / runbook / check が実装と同期している。
- [x] `npm run acceptance:package:check` と `npm run verify` が pass する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run cfn:inventory:check`
- `npm run docs:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PRレビュー観点

- AC-081 の CloudFormation inventory 証跡が、主要 type だけでなく resource detail と status も検査する形になっていること。
- AWS 実行済みや final acceptance 完了を誤って主張していないこと。
- fixture が ready path と negative path の両方を覆っていること。

## リスク

- 実 CloudFormation resource status に一時的な進行中 status が含まれる場合、final acceptance 候補としては reject される。
- 外部作業が必要な final acceptance 残件はこのタスクでは解消しない。

## 実施結果

- 実装 commit: `8c9f615` `✅ test: final cfn resource detail検査を追加`
- 作業レポート: `reports/working/20260527-2107-final-cfn-resource-detail-gate.md`
- PR 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554343170
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554346427

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run cfn:inventory:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final file 未配置のため not ready）
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/acceptance/cloudformation/cloudformation_inventory.schema.json docs/ops/runbooks/final-acceptance.md tools/check-cloudformation-inventory.js tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-2103-final-cfn-resource-detail-gate.md`: pass
- `pre-commit run --files reports/working/20260527-2107-final-cfn-resource-detail-gate.md`: pass
- `pre-commit run --files tasks/done/20260527-2103-final-cfn-resource-detail-gate.md`: pass

## 残件

- final acceptance は未完了。Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff は pending。
