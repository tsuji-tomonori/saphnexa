# final checklist artifact AC153 sync

- 状態: doing
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

AC-153 は最終 defect snapshot refresh を必要とし、`final-checklist-signoff` action は AC-153 を含むようになった。一方、artifact summary の `final-checklist` artifact は AC-004 / AC-150 / AC-151 / AC-152 のみを `acceptance_ids` に持ち、AC-153 を含んでいない。

## 問題文

2026-05-28 時点の PR branch で、final checklist signoff action は AC-153 を扱うが、`dist/acceptance/artifact_summary.draft.json` の `final-checklist` artifact が AC-153 を対象として示さず、最終 checklist が全 AC 行を署名対象にする事実とずれている。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `tools/external-acceptance-actions.js` の `final-checklist-signoff.acceptance_ids` は AC-153 を含む。
  - `tools/acceptance-artifact-summary.js` の `final-checklist.acceptance_ids` は AC-153 を含まない。
  - `tools/check-acceptance-package.js` は `final-checklist` artifact が存在することは検査するが、AC-153 を含むことは検査していない。
- 推定原因:
  - AC-153 gate 追加時に external action と defect-list artifact は同期したが、全 AC 行を含む final checklist artifact の acceptance ID までは更新していなかった。
- 根本原因:
  - final checklist artifact の acceptance ID set と signoff action の acceptance ID set を同期検査していなかった。
- 影響範囲:
  - artifact summary だけを見ると、AC-153 が final checklist signoff 対象から外れているように見える。
- 対策:
  - `final-checklist` artifact の `acceptance_ids` に AC-153 を追加し、package checker で検査する。

## 目的

artifact summary の final checklist artifact を AC-153 の最終 signoff gate と同期し、AC-153 が最終 checklist 署名対象であることを明示する。

## スコープ

- `tools/acceptance-artifact-summary.js` の `final-checklist.acceptance_ids` に AC-153 を追加する。
- `tools/check-acceptance-package.js` に final checklist artifact が AC-153 を含む検査を追加する。

## スコープ外

- GitHub issue tracker の実再取得
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final signoff

## 受け入れ条件

- [x] artifact summary の `final-checklist.acceptance_ids` が AC-153 を含む。
- [x] package checker が `final-checklist` artifact の AC-153 対応を検査する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [x] artifact summary / checker を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `final-checklist.acceptance_ids` に AC-153 を追加する。
2. package checker に final checklist artifact の AC-153 検査を追加する。
3. acceptance package / verify を実行する。
4. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

ユーザー向け docs は既に AC-153 signoff を記載済み。artifact summary の実装と checker の同期のみであり、追加 docs 更新は不要。

## 検証計画

- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files tools/acceptance-artifact-summary.js tools/check-acceptance-package.js tasks/do/20260528-0106-final-checklist-artifact-ac153-sync.md reports/working/20260528-0106-final-checklist-artifact-ac153-sync.md`

## 実施結果

- `tools/acceptance-artifact-summary.js` の `final-checklist.acceptance_ids` に AC-153 を追加した。
- `tools/check-acceptance-package.js` に `final-checklist` artifact が AC-153 を含む検査を追加した。
- 外部 action は実行せず、pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- artifact summary の final checklist 対象 ID が 1 件増える。これは AC-153 が最終 checklist signoff 対象であることを反映する意図的な変更である。
