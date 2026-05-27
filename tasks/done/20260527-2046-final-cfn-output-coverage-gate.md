# final cfn output coverage gate

- 状態: done
- タスク種別: 機能追加
- 対象PR: #1

## 背景

Saphnexa の final acceptance は `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たす必要がある。現在の `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` 候補検査は、CloudFormation `stack_outputs` が非空であることは確認しているが、基本設計で必要な主要 output が含まれることまでは検査していない。

## 目的

最終証跡候補で、CloudFormation inventory が主要 output を欠いたまま final ready になることを防ぐ。

## スコープ

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- 必要に応じた CloudFormation inventory schema / evidence docs
- 作業レポート

## 対象外

- AWS への deploy / publish
- Git tag / GitHub release 作成
- CloudFormation `describe-stacks` / `list-stack-resources` の実行
- final checklist 署名

## 計画

1. final candidate validator に主要 CloudFormation output key 検査を追加する。
2. ready fixture に主要 output を含める。
3. 欠落 output fixture が invalid になることを追加検証する。
4. schema/docs への反映要否を確認する。
5. acceptance と repository 検証を実行する。
6. レポート、commit、push、PR コメントを行う。

## ドキュメントメンテナンス方針

final inventory schema が output の意味を表す場合は、schema または関連チェックを更新する。恒久 docs に追加するほどの運用手順変更がない場合は、作業レポートに理由を記録する。

## 受け入れ条件

- [x] final candidate validator が主要 CloudFormation output key の存在を検査する。
- [x] ready fixture が主要 output を含み、`npm run acceptance:final-candidate:fixture:check` が pass する。
- [x] 主要 output 欠落 fixture が invalid になり、該当 error label を検査する。
- [x] `npm run acceptance:final-candidate:check` は final file 未配置を not ready として扱い、完了扱いにしない。
- [x] `npm run acceptance:package:check` と `npm run verify` が pass する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PRレビュー観点

- CloudFormation output 検査が AC-002 / AC-081 の提出物確認を強めていること。
- AWS 実行済みや final acceptance 完了を誤って主張していないこと。
- fixture が ready path と negative path の両方を覆っていること。

## リスク

- 実 CloudFormation output key の命名と validator の期待名がずれると、最終証跡作成時に調整が必要になる。
- 外部作業が必要な final acceptance 残件はこのタスクでは解消しない。

## 実施結果

- 実装 commit: `7cfcbc0` `✅ test: final cfn output coverage検査を追加`
- 作業レポート: `reports/working/20260527-2050-final-cfn-output-coverage-gate.md`
- PR 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554255292
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554257381

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run cfn:inventory:build`: pass
- `npm run cfn:inventory:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final file 未配置のため not ready）
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/acceptance/cloudformation/cloudformation_inventory.schema.json tools/check-cloudformation-inventory.js tools/check-final-evidence-candidate-fixtures.js tools/cloudformation-inventory.js tools/final-evidence-candidate.js tasks/do/20260527-2046-final-cfn-output-coverage-gate.md`: pass
- `pre-commit run --files reports/working/20260527-2050-final-cfn-output-coverage-gate.md`: pass
- `pre-commit run --files tasks/done/20260527-2046-final-cfn-output-coverage-gate.md`: pass

## 残件

- final acceptance は未完了。Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff は pending。
