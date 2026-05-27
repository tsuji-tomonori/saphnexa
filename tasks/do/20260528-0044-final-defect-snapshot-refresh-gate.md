# final defect snapshot refresh gate

- 状態: doing
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

AC-153 は Blocker/Critical defect 0 件を求めており、traceability には `gh issue list` の snapshot と最終検収時の再取得が必要であることが書かれている。一方で、現在の trace state は `local_verified` のため、最終 readiness の defect gate が stale snapshot でも ready に見える。

## 問題文

2026-05-28 時点の PR branch で、`docs/acceptance/defects/open_issues_snapshot.json` は 2026-05-27 取得の snapshot だが、AC-153 が `local_verified` のままで、external action plan / artifact summary / final readiness が defect snapshot の最終再取得を pending として明示しない。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `docs/acceptance/traceability.md` の AC-153 は「最終検収時は再取得が必要」と書いている。
  - `docs/acceptance/defects/open_issues_snapshot.json` の `captured_at` は `2026-05-27T11:25:00+09:00` である。
  - `tools/final-acceptance-readiness.js` は snapshot の `blocker_critical_open_count === 0` だけで defect gate ready とする。
  - `tools/external-acceptance-actions.js` には defect snapshot 再取得 action がない。
- 推定原因:
  - 初期の local acceptance package では open issue snapshot をローカル証跡として扱い、最終検収時の再取得を machine-readable gate にしていなかった。
- 根本原因:
  - AC-153 の「最終再取得が必要」という条件が trace state / external action / artifact summary / final readiness に同期されていない。
- 影響範囲:
  - stale defect snapshot のまま、重大欠陥 gate を最終検収条件として満たしたように見える可能性がある。
- 対策:
  - AC-153 を final external action 待ちとして扱い、defect snapshot refresh を external action / artifact summary / final readiness に追加する。

## 目的

AC-153 の重大欠陥なし判定を、最終検収時の issue tracker 再取得が完了するまで pending として明示し、stale snapshot で final ready にならないようにする。

## スコープ

- `docs/acceptance/traceability.md` の AC-153 を `requires_aws` 相当の外部再取得待ちとして更新する。
- external action plan に defect snapshot refresh action を追加する。
- artifact summary に defect list artifact を追加する。
- final readiness / package check / external action check を新しい pending gate に同期する。

## スコープ外

- GitHub issue tracker の最終再取得実行
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final signoff

## 受け入れ条件

- [x] AC-153 が final defect snapshot refresh 待ちとして trace / readiness に現れる。
- [x] external action plan が defect snapshot refresh action を持つ。
- [x] artifact summary が defect list artifact を最終提出物として持つ。
- [x] final readiness が stale local snapshot だけで defect gate ready にならない。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [x] trace/action/artifact/readiness/checker を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. AC-153 trace state と evidence を final refresh pending に更新する。
2. external action plan と artifact summary に defect snapshot refresh / defect list を追加する。
3. final readiness の defect gate と checker を AC-153 pending に同期する。
4. package/final/external/verify を実行する。
5. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

traceability の AC-153 を更新する。既存 runbook は final checklist と外部証跡手順を扱っているが、必要なら defect snapshot refresh 手順の明示を追加する。

## 検証計画

- `npm run acceptance:external-actions:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run acceptance:external-actions:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run docs:check`
- pass: `npm run acceptance:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files docs/acceptance/traceability.md docs/ops/runbooks/final-acceptance.md tools/acceptance-artifact-summary.js tools/check-acceptance-package.js tools/check-external-acceptance-actions.js tools/check-final-acceptance-readiness.js tools/external-acceptance-actions.js tools/final-acceptance-readiness.js tasks/do/20260528-0044-final-defect-snapshot-refresh-gate.md reports/working/20260528-0044-final-defect-snapshot-refresh-gate.md`

## 実施結果

- AC-153 を `requires_aws` として traceability に反映し、最終 defect snapshot refresh 待ちを明示した。
- external action plan に `defect-snapshot-refresh` を追加した。
- artifact summary に `defect-list` artifact を追加した。
- final readiness の defect gate が `snapshot_refresh_required=true` と pending reason を出すようにした。
- final acceptance runbook に issue tracker 再取得手順と defect snapshot 証跡を追加した。
- 外部 action は実行せず、pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- AC-153 が final pending に変わるため、final readiness の blocker 数と artifact summary item 数が増える。これは stale defect snapshot で最終検収を満たした扱いにしないための意図的な変更である。
