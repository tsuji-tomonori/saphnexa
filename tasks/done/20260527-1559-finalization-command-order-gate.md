# finalization command order gate

- 状態: done
- タスク種別: 検証強化
- 作成日時: 2026-05-27 15:59 JST
- 対象 PR: #1

## 背景

`dist/acceptance/final_readiness.json` の `finalization_commands` は最終検収前に実行すべきコマンド列を示すが、現在の runbook / CI と比べると `acceptance:final-candidate:fixture:check` が含まれておらず、final readiness と package check の順序も一致していない。

## 目的

final readiness が提示する最終化コマンド列を、runbook と CI で使う順序に同期し、checker で固定する。

## スコープ

- `tools/final-acceptance-readiness.js` の `finalization_commands` を更新する。
- `tools/check-final-acceptance-readiness.js` でコマンド列を検査する。
- 必要に応じて runbook / local verification docs と同期する。
- 実 Git tag/release、AWS deploy/publish、CloudFormation capture、final checklist signoff は実行しない。

## 実装チェックリスト

- [x] final readiness の finalization commands を runbook 順に更新する。
- [x] final readiness checker でコマンド列を検査する。
- [x] docs のコマンド列と矛盾がないことを確認する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:final:build` が更新後の command list を生成する。
- `npm run acceptance:final:check` が command list を検査して pass する。
- `npm run docs:check`、`npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-001/002/004/081: final evidence / checklist / CloudFormation / package の検証順序が runbook と一致する。
- AC-150/151/152: P0/P1/P2 aggregate 判定前に final candidate と final readiness の gate が実行される順序になっている。

## 検証計画

- `npm run acceptance:final:build`
- `npm run acceptance:final:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- command list の同期は実行順のガードであり、外部証跡の代替ではない。
- final acceptance の外部操作は未実行のまま。
