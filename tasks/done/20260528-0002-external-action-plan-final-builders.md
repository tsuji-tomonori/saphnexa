# external action plan final builders

- 状態: done
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final acceptance の実行手順として、CloudFormation raw capture から normalized inventory を作成する `npm run cfn:inventory:normalize`、final manifest を作成する `npm run acceptance:final-manifest:build`、final checklist を作成する `npm run acceptance:final-checklist:build` を追加済みである。

一方、`dist/acceptance/external_action_plan.json` を生成する `tools/external-acceptance-actions.js` の candidate command は、CloudFormation capture では AWS CLI 取得まで、final evidence candidate では検証コマンドだけを案内しており、実際の生成手順を含んでいない。

## 問題文

2026-05-28 時点の PR branch で、external action plan は final acceptance の外部作業に必要な builder / normalizer コマンドを candidate command として案内できていない。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `docs/ops/runbooks/final-acceptance.md` は `npm run acceptance:final-manifest:build`、`npm run acceptance:final-checklist:build`、`npm run cfn:inventory:normalize` を手順として記載している。
  - `tools/external-acceptance-actions.js` の `cloudformation-capture` action は raw AWS CLI 取得コマンドだけを列挙している。
  - `tools/external-acceptance-actions.js` の `final-evidence-candidate` action は final candidate check / readiness build / readiness check だけを列挙している。
- 推定原因:
  - builder / normalizer 追加後に runbook は更新したが、external action plan の candidate command 契約を同じタイミングで同期していなかった。
- 根本原因:
  - finalization 手順の authoritative source が runbook と external action plan に分かれており、builder 追加時の同期検査が不足していた。
- 影響範囲:
  - 外部作業者が action plan だけを見ると、final evidence manifest / checklist / normalized CloudFormation inventory の作成手順を漏らす可能性がある。
- 対策:
  - external action plan に builder / normalizer command を追加し、check script で同期を検査する。

## 目的

external action plan を final acceptance runbook と同期し、外部 action 実行前に必要な生成コマンドが candidate command として明示される状態にする。

## スコープ

- `tools/external-acceptance-actions.js` の candidate command を更新する。
- `tools/check-external-acceptance-actions.js` に builder / normalizer command の同期検査を追加する。
- 必要に応じて runbook/docs と検証結果を確認する。

## スコープ外

- Git tag/release の作成
- AWS deploy/publish、CloudFormation capture の実行
- final evidence manifest / checklist の実作成または署名

## 受け入れ条件

- [x] `cloudformation-capture` action に `npm run cfn:inventory:normalize` が含まれる。
- [x] `final-evidence-candidate` action に `npm run acceptance:final-manifest:build` が含まれる。
- [x] `final-evidence-candidate` action に `npm run acceptance:final-checklist:build` が含まれる。
- [x] `npm run acceptance:external-actions:check` が上記コマンドの存在を検査する。
- [x] 外部 action は pending / requires_confirmation / external_state_change のまま維持される。

## Done 条件

- [x] action plan builder と checker を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `tools/external-acceptance-actions.js` の `cloudformation-capture` と `final-evidence-candidate` に生成コマンドを追加する。
2. `tools/check-external-acceptance-actions.js` に同期検査を追加する。
3. `npm run acceptance:external-actions:check`、関連 final/package check、`npm run verify` を実行する。
4. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

runbook には既に builder / normalizer 手順が記載済み。今回は external action plan を既存 docs に同期する修正であり、追加 docs 更新は原則不要。検証時に不整合があれば同一 scope で修正する。

## 検証計画

- `npm run acceptance:external-actions:check`
- `npm run docs:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run acceptance:external-actions:check`
- pass: `npm run docs:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files tools/external-acceptance-actions.js tools/check-external-acceptance-actions.js tasks/do/20260528-0002-external-action-plan-final-builders.md reports/working/20260528-0002-external-action-plan-final-builders.md`

## 実施結果

- `tools/external-acceptance-actions.js` の `cloudformation-capture` action に `CFN_CAPTURED_AT=<capture-iso-timestamp> npm run cfn:inventory:normalize` を追加した。
- `tools/external-acceptance-actions.js` の `final-evidence-candidate` action に `npm run acceptance:final-manifest:build` と `npm run acceptance:final-checklist:build` を追加した。
- `tools/check-external-acceptance-actions.js` に上記 command と実行順の検査を追加した。
- runbook は既に同じ builder / normalizer 手順を記載済みのため、追加 docs 更新は不要と判断した。
- 外部 action は pending / requires_confirmation / external_state_change のまま維持した。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555812511
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555814640

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- 外部 action plan のコマンドが増えるため、実行順の読みやすさが重要になる。外部 state は変更せず、pending gate を維持する。
