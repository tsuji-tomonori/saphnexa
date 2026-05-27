# acceptance git sha consistency gate

- 状態: done
- タスク種別: 検証強化
- 作成日時: 2026-05-27 15:42 JST
- 対象 PR: #1

## 背景

`dist/acceptance/evidence_manifest.draft.json` と `dist/acceptance/summary.json` は `git_commit_sha` を持つが、`acceptance:package:check` は 40 桁 hex 形式だけを確認しており、現在の Git ref と一致することまでは検査していない。

## 目的

AC-001 の「検収対象 Git commit SHA の固定」に対して、draft acceptance package の manifest / summary が現在の Git ref と一致することを機械検査する。

## スコープ

- Git commit SHA 取得処理を共通 helper 化する。
- `build-acceptance-package` と `check-acceptance-package` で同じ Git ref 解決を使う。
- manifest / summary の `git_commit_sha` が現在の commit と一致することを検査する。
- 実 Git tag/release 作成は実行しない。

## 実装チェックリスト

- [x] Git SHA helper を追加する。
- [x] `build-acceptance-package` を helper 利用へ更新する。
- [x] `check-acceptance-package` に manifest / summary / current Git ref の一致検査を追加する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:package:build` が current Git ref を manifest / summary に記録する。
- `npm run acceptance:package:check` が current Git ref との一致を検査して pass する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-001: draft evidence manifest と summary の `git_commit_sha` が現在の Git ref と一致することを検査できる。
- AC-150/151/152: final acceptance aggregate 前提となる package evidence が別 commit の古い draft を誤って参照しない。

## 検証計画

- `npm run acceptance:package:build`
- `npm run acceptance:package:check`
- `npm run acceptance:final:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- `git_commit_sha` の一致検査は commit ref の固定性を確認するものであり、Git tag / GitHub release の作成完了を意味しない。
- AC-001 の final PASS には引き続き Git tag / release / final evidence manifest が必要。
