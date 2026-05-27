# finalization command order builders

- 状態: do
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final evidence manifest builder は `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` を読み込む。CloudFormation inventory は raw `describe-stacks` / `list-stack-resources` の取得後、`npm run cfn:inventory:normalize` で生成する。

## 問題文

2026-05-28 時点の runbook では、`npm run acceptance:final-manifest:build` が CloudFormation inventory normalizer より前の手順として記載されている。また `final_readiness.json` の `finalization_commands` は、final manifest / checklist builder と CloudFormation normalizer を含んでいない。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `tools/final-evidence-manifest.js` は default で `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` を読む。
  - `docs/ops/runbooks/final-acceptance.md` は manifest build を手順 1、CloudFormation normalizer を手順 3 として記載している。
  - `tools/final-acceptance-readiness.js` の `finalization_commands` は builder / normalizer command を含んでいない。
- 推定原因:
  - builder 追加時に「manifest input 作成」と「manifest build」を同じ手順にまとめ、依存する CloudFormation inventory の生成順序を明示できていなかった。
- 根本原因:
  - finalization command order の検査対象が既存 check command に偏り、実 final artifact を作る build command の順序契約を持っていなかった。
- 影響範囲:
  - runbook どおりに進めると、CloudFormation inventory 未作成の状態で final manifest build を実行して失敗する可能性がある。
- 対策:
  - runbook と finalization command list を、CloudFormation capture/normalize -> manifest build -> checklist build -> candidate/readiness/package checks の順に同期し、check script で検査する。

## 目的

finalization 手順が実際のファイル依存順に沿っており、readiness 証跡にも builder / normalizer command が明示される状態にする。

## スコープ

- `docs/ops/runbooks/final-acceptance.md` の手順順序を修正する。
- `tools/final-acceptance-readiness.js` の `finalization_commands` を更新する。
- `tools/check-final-acceptance-readiness.js` と `tools/check-docs.js` に順序検査を追加する。

## スコープ外

- CloudFormation capture の実行
- final evidence manifest / checklist の実作成
- Git tag/release、AWS deploy/publish、final signoff

## 受け入れ条件

- [x] runbook は CloudFormation raw capture / normalizer の後に final manifest build を案内する。
- [x] `finalization_commands` は `CFN_CAPTURED_AT=<capture-iso-timestamp> npm run cfn:inventory:normalize` を含む。
- [x] `finalization_commands` は `npm run acceptance:final-manifest:build` を含む。
- [x] `finalization_commands` は `npm run acceptance:final-checklist:build` を含む。
- [x] readiness check が normalizer -> manifest build -> checklist build -> final candidate check の順序を検査する。
- [x] docs check が runbook の normalizer -> manifest build 順序を検査する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [ ] runbook / readiness builder / checks を更新する。
- [ ] 選定した検証コマンドが pass する。
- [ ] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. final acceptance runbook の手順を CloudFormation capture/normalize -> manifest build -> checklist build の順に並べ替える。
2. `tools/final-acceptance-readiness.js` の `finalization_commands` に normalizer / manifest builder / checklist builder を追加する。
3. `tools/check-final-acceptance-readiness.js` と `tools/check-docs.js` に順序検査を追加する。
4. docs/final/package/verify を実行し、PR コメントと task done 更新まで進める。

## ドキュメント保守方針

final acceptance runbook の手順依存に関わるため、docs を同一 scope で更新する。local verification docs は検証コマンド一覧が既に builder fixture を含むため、必要な場合のみ追加修正する。

## 検証計画

- `npm run docs:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run docs:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/final-acceptance-readiness.js tools/check-final-acceptance-readiness.js tools/check-docs.js tasks/do/20260528-0009-finalization-command-order-builders.md reports/working/20260528-0009-finalization-command-order-builders.md`

## 実施結果

- `docs/ops/runbooks/final-acceptance.md` を CloudFormation raw capture / normalizer -> final manifest build -> final checklist build の順に修正した。
- `tools/final-acceptance-readiness.js` の `finalization_commands` に CloudFormation normalizer、final manifest builder、final checklist builder を追加した。
- `tools/check-final-acceptance-readiness.js` に finalization command の順序検査を追加した。
- `tools/check-docs.js` に final acceptance runbook の順序検査を追加した。
- 外部 action は実行せず、pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- runbook の順序変更は実行手順の明確化であり、外部状態は変更しない。実 final 証跡作成は引き続き確認必須。
