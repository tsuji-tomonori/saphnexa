# final manifest git ref gate

- 状態: done
- タスク種別: 検証強化
- 作成日時: 2026-05-27 16:10 JST
- 対象 PR: #1

## 背景

final candidate validator は final evidence manifest の `git_commit_sha` が 40 桁 hex で非 placeholder であることを検査する。一方、検証実行時の Git ref と一致することは検査していないため、final evidence manifest が別 commit を指していても形式上は通過する余地がある。

## 目的

AC-001 の検収対象 commit 固定に対して、final evidence manifest の `git_commit_sha` が検証実行時の Git ref と一致することを final candidate validator で検査する。

## スコープ

- final candidate validator に current Git ref 一致検査を追加する。
- final candidate fixture を current Git ref に追随させる。
- final acceptance runbook の検証項目を更新する。
- 実 Git tag/release 作成は実行しない。

## 実装チェックリスト

- [x] final candidate validator で `manifest.git_commit_sha` と current Git ref の一致を検査する。
- [x] ready fixture が current Git ref を使うようにする。
- [x] invalid fixture が commit mismatch を検出することを検査する。
- [x] docs を同期する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:final-candidate:fixture:check` が current Git ref 一致と mismatch 検出を検査して pass する。
- `npm run acceptance:final-candidate:check` の既存 `not_ready` preflight 挙動を維持する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-001: final evidence manifest の `git_commit_sha` が検証対象 Git ref と一致することを検査できる。
- AC-150/151/152: aggregate PASS 前提となる final evidence が別 commit の証跡を参照しない。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- Git ref 一致検査は final evidence manifest の commit 対象を固定するが、Git tag / GitHub release の作成完了を意味しない。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
