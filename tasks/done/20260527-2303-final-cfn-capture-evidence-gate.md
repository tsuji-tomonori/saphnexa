# final CloudFormation capture evidence gate

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-081 は、検収環境の CloudFormation outputs/inventory が基本設計の主要リソースと一致することを求めている。現在の final candidate validator は `source=aws-cloudformation-inventory`、stack status、outputs、resources、主要 resource type / count を検査するが、`describe-stacks` と `list-stack-resources` の実 capture 由来であることを示す capture metadata は必須化していない。

## 目的

final CloudFormation inventory に capture evidence metadata を要求し、capture command / capture timestamp がない inventory を AC-081 の final 証跡として扱わない。

## スコープ

- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` に AWS source 用の capture evidence schema を追加する。
- `tools/final-evidence-candidate.js` に final CloudFormation inventory の capture evidence 検査を追加する。
- `tools/check-final-evidence-candidate-fixtures.js` に capture evidence 欠落 fixture を追加する。
- `tools/check-cloudformation-inventory.js` と `docs/ops/runbooks/final-acceptance.md` を schema / validator と同期する。

## スコープ外

- AWS CloudFormation `describe-stacks` / `list-stack-resources` の実行
- `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` の作成
- Git tag/release、AWS deploy/publish、final evidence manifest / checklist の最終作成・署名

## 受け入れ条件

- [x] AWS source の final CloudFormation inventory は capture evidence metadata を必須とする。
- [x] capture evidence は `describe-stacks` と `list-stack-resources` の command と ISO timestamp を含む。
- [x] capture evidence 欠落 fixture は final candidate ready にならない。
- [x] 既存の ready fixture は capture evidence を含めて引き続き ready になる。
- [x] AC-081 の外部 CloudFormation capture を完了扱いしない。
- [x] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [x] schema / validator / fixture / runbook を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. CloudFormation inventory schema に `capture_evidence` object を追加し、AWS source condition で required にする。
2. final candidate validator で `captured_at`、`describe_stacks_command`、`list_stack_resources_command` を検査する。
3. ready fixture に capture evidence を追加し、欠落 fixture で regression coverage を追加する。
4. runbook の final inventory 検証観点に capture evidence を追記する。

## ドキュメント保守方針

final acceptance runbook は最終 CloudFormation inventory の確認観点を列挙しているため、capture evidence 必須化を同じ箇所へ追記する。設計書本体や検収条件 source は変更しない。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run cfn:inventory:build`
- `npm run cfn:inventory:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- 最終 CloudFormation inventory 作成者は `capture_evidence` を追加する必要がある。runbook と schema で必須項目を明示し、欠落時は final candidate check で検出する。

## 実施結果

- 実装 commit: `5988515`
- 作業レポート: `reports/working/20260527-2307-final-cfn-capture-evidence-gate.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555289568
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555293830

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run cfn:inventory:build`: pass
- `npm run cfn:inventory:check`: pass
- `npm run acceptance:final:check`: pass（current readiness は final acceptance not ready）
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/acceptance/cloudformation/cloudformation_inventory.schema.json docs/ops/runbooks/final-acceptance.md tools/check-cloudformation-inventory.js tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-2303-final-cfn-capture-evidence-gate.md reports/working/20260527-2307-final-cfn-capture-evidence-gate.md`: pass

## 残件

- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest / checklist の最終作成・署名は未実施。
