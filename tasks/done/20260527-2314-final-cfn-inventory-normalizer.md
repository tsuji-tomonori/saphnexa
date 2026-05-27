# final CloudFormation inventory normalizer

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

AC-081 では検収環境の CloudFormation outputs/inventory が基本設計に定義した主要 resource type / output と一致することを求める。現在の runbook は `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` を CloudFormation 実取得結果から正規化して保存する手順を持つが、AWS CLI の raw JSON から final inventory へ変換する repository tool がない。

## 目的

AWS `describe-stacks` / `list-stack-resources` の raw JSON から、final candidate validator が検査できる `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` 形式へ正規化する tool と fixture check を追加する。

## スコープ

- CloudFormation raw capture JSON を normalized final inventory へ変換する module / CLI を追加する。
- normalizer の fixture check と npm script を追加する。
- final acceptance runbook と local verification docs に normalizer 手順・検証コマンドを追記する。
- `npm run verify` に normalizer fixture check を組み込む。

## スコープ外

- AWS CloudFormation `describe-stacks` / `list-stack-resources` の実行
- `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` の実 final 証跡作成
- Git tag/release、AWS deploy/publish、final evidence manifest / checklist の最終作成・署名

## 受け入れ条件

- [x] raw `describe-stacks` JSON から stack id、name、status、outputs を抽出できる。
- [x] raw `list-stack-resources` JSON から logical id、physical id、resource type、resource status を抽出できる。
- [x] normalized inventory は `source=aws-cloudformation-inventory`、`final_acceptance_eligible=true`、`aws_capture_required=false`、`capture_evidence` を含む。
- [x] fixture check が normalizer の positive path と invalid raw input を検査する。
- [x] runbook / local verification docs が normalizer command と raw input path を示す。
- [x] AC-081 の外部 CloudFormation capture を完了扱いしない。
- [x] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [x] normalizer module / CLI / fixture check / npm script / docs を追加する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `tools/final-cloudformation-inventory.js` に raw AWS JSON normalizer を実装する。
2. `tools/build-final-cloudformation-inventory.js` を追加し、default raw paths から final inventory を生成できるようにする。
3. `tools/check-final-cloudformation-inventory-fixtures.js` を追加し、fixture raw JSON から normalized inventory を生成して検査する。
4. `package.json`、`docs/ops/runbooks/final-acceptance.md`、`docs/ops/local-verification.md`、`tools/check-docs.js` を同期する。

## ドキュメント保守方針

運用手順に関わるため `docs/ops/runbooks/final-acceptance.md` に final inventory normalizer の実行手順を追加する。ローカルで検査できる fixture command は `docs/ops/local-verification.md` にも追記する。

## 検証計画

- `npm run cfn:inventory:normalize:fixture:check`
- `npm run cfn:inventory:build`
- `npm run cfn:inventory:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final:check`
- `npm run docs:check`
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

- 実 AWS raw JSON の shape が fixture と異なる場合は final capture 時に調整が必要になる。AWS CLI の代表 shape に合わせ、invalid raw input は fixture で検出する。

## 実施結果

- 実装 commit: `56a62f6`
- 作業レポート: `reports/working/20260527-2319-final-cfn-inventory-normalizer.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555402592
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555407152

## 検証結果

- `npm run cfn:inventory:normalize:fixture:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run cfn:inventory:build`: pass
- `npm run cfn:inventory:check`: pass
- `npm run acceptance:final:check`: pass（current readiness は final acceptance not ready）
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files package.json docs/ops/runbooks/final-acceptance.md docs/ops/local-verification.md tools/check-docs.js tools/final-cloudformation-inventory.js tools/build-final-cloudformation-inventory.js tools/check-final-cloudformation-inventory-fixtures.js tasks/do/20260527-2314-final-cfn-inventory-normalizer.md reports/working/20260527-2319-final-cfn-inventory-normalizer.md`: pass

## 残件

- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest / checklist の最終作成・署名は未実施。
