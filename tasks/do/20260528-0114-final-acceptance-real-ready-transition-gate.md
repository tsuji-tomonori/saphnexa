# final acceptance real-ready transition gate

- 状態: doing
- タスク種別: 検収 gate 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

`docs/ops/runbooks/final-acceptance.md` は final evidence candidate 作成後に `npm run acceptance:final:check` と `npm run acceptance:package:check` を実行する手順を示している。一方、現在の real command path では traceability の `requires_aws` 行と draft package 前提の検査が固定され、final evidence / checklist / CloudFormation / defect snapshot が揃っても readiness と package summary が ready へ遷移できない。

## 目的

外部 action 実行後の実証跡が揃った場合に final readiness / package summary が ready へ遷移できるようにし、現行の local preflight では pending を維持する。

## スコープ

- final readiness builder / checker の ready・pending 両分岐を整える。
- acceptance package build / check が local draft と final-ready path の両方を検査できるようにする。
- fixture で final-ready path を回帰検査する。
- runbook と検査実装の同期を保つ。

## スコープ外

- GitHub issue tracker の実再取得
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final signoff の実行
- `docs/acceptance/final/*` の実証跡ファイル作成

## 受け入れ条件

- [x] final candidate ready かつ fresh defect snapshot の場合、final readiness が `final_acceptance_ready=true` へ遷移できる。
- [x] 現在の local preflight では final readiness / package が pending のまま pass する。
- [x] `acceptance:final:check` と `acceptance:package:check` が ready / pending 両分岐を検査する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [x] 実装と必要な docs を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. final readiness の blocker / defect / artifact summary 判定を final candidate ready path に対応させる。
2. final readiness checker と acceptance package checker を pending / ready 分岐へ変更する。
3. final readiness fixture と package fixture 相当の検査で ready path を確認する。
4. docs check / acceptance checks / pre-commit を実行する。

## ドキュメント保守方針

既存 runbook の手順に実装を合わせる修正であり、必要なら final acceptance runbook の検証説明のみ更新する。

## 検証計画

- `npm run acceptance:final:fixture:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run acceptance:final:fixture:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run docs:check`
- pass: `npm run lint`
- pass: `npm run typecheck`
- pass: `npm run verify`

## 実施結果

- final readiness が final candidate ready・fresh defect snapshot・artifact/external gates を揃えた fixture で `final_acceptance_ready=true` へ遷移できるようにした。
- local preflight では final candidate 未作成と stale defect snapshot により pending を維持する。
- acceptance package summary / checker が final readiness の ready / pending state を反映・検査するようにした。
- 外部 action は実行せず、現在の実 package は `final_acceptance_ready=false` のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- ready 分岐を追加しても、実 Git tag/release/AWS/CloudFormation/signoff は外部 action のままであり、実証跡なしに ready へ遷移させないことが重要。
