# finalization command defect refresh

- 状態: done
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

AC-153 の最終 defect snapshot refresh は external action plan と runbook に追加済みである。一方、`dist/acceptance/final_readiness.json` の `finalization_commands` は最終検収前に実行すべき command sequence を示すが、`gh issue list --state open --json number,title,labels,state` が含まれていない。

## 問題文

2026-05-28 時点の PR branch で、final readiness の `finalization_commands` が defect snapshot refresh 手順を案内せず、runbook / external action plan と final readiness の最終化手順がずれている。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `tools/external-acceptance-actions.js` は `defect-snapshot-refresh` action を持つ。
  - `docs/ops/runbooks/final-acceptance.md` は `gh issue list --state open --json number,title,labels,state` を手順に含む。
  - `tools/final-acceptance-readiness.js` の `finalization_commands` は CloudFormation normalize、final manifest/checklist build、final checks を含むが、defect snapshot refresh command を含まない。
- 推定原因:
  - AC-153 gate 追加時に external action / runbook / artifact summary / readiness gate は同期したが、finalization command sequence までは同期していなかった。
- 根本原因:
  - finalization command list と external action plan の command set を同時に検査する契約が不足していた。
- 影響範囲:
  - final readiness を見て最終化する operator が、fresh defect snapshot 再取得を見落とす可能性がある。
- 対策:
  - `finalization_commands` に defect snapshot refresh command を追加し、checker で final manifest build より前に実行されることを検査する。

## 目的

final readiness の finalization command sequence を AC-153 の最終 defect snapshot refresh gate と同期し、stale defect snapshot のまま final artifact build に進まない導線にする。

## スコープ

- `tools/final-acceptance-readiness.js` の `finalization_commands` に `gh issue list --state open --json number,title,labels,state` を追加する。
- `tools/check-final-acceptance-readiness.js` の expected command list と順序検査を更新する。

## スコープ外

- GitHub issue tracker の実再取得
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final signoff

## 受け入れ条件

- [x] final readiness の `finalization_commands` に `gh issue list --state open --json number,title,labels,state` が含まれる。
- [x] defect snapshot refresh command が final manifest/checklist build より前に並ぶ。
- [x] checker が上記 command set / order を検査する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [x] readiness builder / checker を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `finalization_commands` に defect snapshot refresh command を追加する。
2. checker の expected list と order assertion を更新する。
3. final / package / verify を実行する。
4. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

runbook は既に defect snapshot refresh command を含むため、追加 docs 更新は不要。

## 検証計画

- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files tools/final-acceptance-readiness.js tools/check-final-acceptance-readiness.js tasks/do/20260528-0050-finalization-command-defect-refresh.md reports/working/20260528-0050-finalization-command-defect-refresh.md`

## 実施結果

- `tools/final-acceptance-readiness.js` の `finalization_commands` に `gh issue list --state open --json number,title,labels,state` を追加した。
- `tools/check-final-acceptance-readiness.js` の expected command list と order check を更新した。
- defect snapshot refresh command が final manifest/checklist build より前に並ぶことを検査するようにした。
- 外部 action は実行せず、pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4556173126
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4556175183

## リスク

- `finalization_commands` に GitHub issue tracker 再取得 command が増える。これは最終検収時の外部確認手順であり、この作業では実行していない。
