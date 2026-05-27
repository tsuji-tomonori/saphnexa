# acceptance package check freshness

- 状態: done
- タスク種別: 検証修正
- 作成日時: 2026-05-27 15:51 JST
- 対象 PR: #1

## 背景

`acceptance:package:check` に current Git ref 一致検査を追加した結果、最新 commit 後に `dist/acceptance/*` を再生成していない場合、単独の `npm run acceptance:package:check` が stale draft を検出して失敗する。gate としては正しいが、検証コマンドとしては最新 draft を生成してから検査する導線が必要である。

## 目的

`npm run acceptance:package:check` を単独実行しても、最新 Git ref の draft package を検査できるようにする。

## スコープ

- `acceptance:package:check` の npm script を build + checker の wrapper にする。
- `verify` / CI / Taskfile の既存導線と矛盾しないことを確認する。
- current Git ref 一致検査は維持する。

## 実装チェックリスト

- [x] `acceptance:package:check` が最新 draft を生成してから検査するようにする。
- [x] `npm run acceptance:package:check` 単独で pass することを確認する。
- [x] `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- 最新 commit 直後の状態で `npm run acceptance:package:check` が pass する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-001: `acceptance:package:check` 単独実行でも、draft manifest / summary の `git_commit_sha` が現在の Git ref と一致する。
- AC-150/151/152: package check が stale draft によって aggregate 前提を誤判定しない。

## 検証計画

- `npm run acceptance:package:check`
- `npm run acceptance:package:build`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- `acceptance:package:check` は生成を伴う検証コマンドになる。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
