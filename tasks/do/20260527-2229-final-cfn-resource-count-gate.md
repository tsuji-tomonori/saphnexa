# final cfn resource count gate

- 状態: do
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

AC-081 は「基本設計に定義した主要リソース種別と個数」が検収環境の CloudFormation outputs/inventory と一致することを求める。既存の final candidate validator は主要 `ResourceType` の存在を検査しているが、設計上の最小個数を満たしているかまでは拒否していない。

## 目的

final CloudFormation inventory に主要 resource type が存在していても、設計で要求される最小個数を満たさない場合は final candidate を ready にしない。

## スコープ

- `tools/cloudformation-inventory.js` に主要 CloudFormation resource type の期待最小個数 map を追加する。
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` に期待最小個数 map の schema を追加する。
- `tools/final-evidence-candidate.js` の CloudFormation inventory validation で期待最小個数を検査する。
- `tools/check-final-evidence-candidate-fixtures.js` に主要 resource type の個数不足を拒否する fixture を追加する。
- `tools/check-cloudformation-inventory.js` で draft inventory 側にも期待個数定義が載っていることを確認する。

## スコープ外

- AWS CloudFormation の `describe-stacks` / `list-stack-resources` 実取得
- `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` の作成
- AWS deploy/publish
- final evidence manifest / final checklist の最終作成または署名

## 受け入れ条件

- [ ] final candidate validator が主要 resource type の最小個数不足を `cloudformation.major_resource_type_count.<type>` として拒否する。
- [ ] fixture が、主要 resource type は存在するが個数不足の inventory を ready にしない。
- [ ] 既存の ready fixture は設計上の期待最小個数を満たし、引き続き ready になる。
- [ ] AC-081 の外部 CloudFormation capture を完了扱いしない。
- [ ] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [ ] 実装と fixture を追加する。
- [ ] 選定した検証コマンドが pass する。
- [ ] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. 基本設計 5.5.2 の主要 CloudFormation Type と個数から、最小個数 map を定義する。
2. final inventory の `stack_resources` を type ごとに集計し、期待最小個数以上かを検査する。
3. ready fixture の CloudFormation resources を期待最小個数に合わせて生成する。
4. 個数不足 fixture を追加し、存在チェックだけでは通らないことを確認する。

## ドキュメント保守方針

AC-081 と runbook は既に「種別と個数」の照合を要求しているため、今回の docs 本文更新は不要。実装差分、task、report、PR コメントに gate 強化内容を記録する。

## 検証計画

- `npm run cfn:inventory:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
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

- 期待個数は設計書の「個数」列に基づく最小個数として扱う。`38以上` や `14以上` のような項目は、実装や deploy 方式で増える可能性があるため、完全一致ではなく下限チェックにする。
