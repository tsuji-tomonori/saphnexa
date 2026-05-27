# external actions check freshness

- 状態: done
- タスク種別: 修正
- 作成日時: 2026-05-27 17:07 JST
- 対象 PR: #1

## 背景

`npm run acceptance:external-actions:check` は `dist/acceptance/external_action_plan.json` を読むだけで、生成元の `docs/acceptance/traceability.md` や `tools/external-acceptance-actions.js` が変わった後に `npm run acceptance:external-actions:build` を実行していない場合、古い action plan を検査してしまう可能性がある。

## なぜなぜ分析

### 問題文

外部 action plan の入力である traceability や action 定義が変わった後、`npm run acceptance:external-actions:check` 単独実行では最新の `dist/acceptance/external_action_plan.json` が保証されない。

### 確認済み事実

- `package.json` の `acceptance:external-actions:check` は `node tools/check-external-acceptance-actions.js` のみを実行する。
- `tools/check-external-acceptance-actions.js` は既存の `dist/acceptance/external_action_plan.json` を読む。
- `tools/build-external-acceptance-actions.js` は traceability から unresolved AC を再取得して plan を生成する。
- `acceptance:package:check` と `acceptance:final:check` は build を内包する導線へ揃っている。

### 推測・未確認

- CI/verify では `acceptance:external-actions:build` の直後に check を実行するため、主なリスクは単独実行や変更直後の手元検証である。

### 根本原因

- external action check が生成物の freshness を保証しない設計で、check が依存する `dist` を自動更新しない。
- acceptance 系 check の build 内包方針が script ごとに揃っていなかった。

### 対策方針

- `npm run acceptance:external-actions:check` の実行時に action plan を再生成してから検査する。
- docs 上では build/check の明示手順を維持しつつ、check が再生成することを local verification に追記する。

## 目的

`npm run acceptance:external-actions:check` を単独実行しても最新の external action plan を検査できるようにし、stale `dist` による false failure / false confidence を防ぐ。

## スコープ

- `acceptance:external-actions:check` が `acceptance:external-actions:build` を内包するようにする。
- local verification docs に external action check freshness を追記する。
- CI workflow / final readiness command list / package check の既存挙動を維持する。

## 実装チェックリスト

- [x] `acceptance:external-actions:check` の script を self-refreshing にする。
- [x] local verification docs に external action check freshness を追記する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552690333
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552693400

## Done 条件

- `npm run acceptance:external-actions:check` 単独実行で action plan build と check が pass する。
- `npm run acceptance:final:check`、`npm run acceptance:package:check`、`npm run docs:check`、`npm run ci:check` が pass する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-001/002/004/081/150/151/152: 外部 action plan が最新 trace に基づき pending action を追跡する。
- 外部 action は引き続き `requires_confirmation=true` / `external_state_change=true` / `completed=false` で、実行済み扱いにならない。

## 検証計画

- `npm run acceptance:external-actions:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run ci:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## ドキュメント保守計画

- `docs/ops/local-verification.md` に `acceptance:external-actions:check` が action plan を再生成して検査することを追記する。

## PR レビュー観点

- external action check が stale `dist` を読まないこと。
- 外部操作の候補コマンドを実行せず、pending plan の検査に留まっていること。
- CI workflow と runbook の command order が矛盾しないこと。

## リスク・制約

- `acceptance:external-actions:check` 内で build を再実行するため、`verify` では build が重複する。ただし生成は軽量であり、stale check 防止を優先する。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final checklist signoff は未実行。
