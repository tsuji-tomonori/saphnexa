# acceptance source catalog gate

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 13:16 JST
- 対象 PR: #1

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` は worktree 外にあり、CI では直接参照できない。現在の `tools/acceptance-ids.js` と `docs/acceptance/traceability.md` は全 AC を扱っているが、元検収チェックリストの領域・重要度・件数との同期を機械的に検査できない。

## 目的

検収チェックリスト由来の source catalog snapshot をリポジトリ内に置き、traceability、draft checklist、readiness/package が元チェックリストの ID/重要度/件数から逸脱していないことを CI で検査する。

## スコープ

- `docs/acceptance/source/acceptance_catalog.json` を追加する。
- catalog を読み込む module と check script を追加する。
- `acceptance:check`、`verify`、CI、Taskfile、docs/admin report/package check を同期する。
- 外部 release/deploy/publish/signoff は実行しない。

## 実装チェックリスト

- [x] source catalog snapshot を追加する。
- [x] traceability と draft checklist が catalog の全 ID を網羅することを検査する。
- [x] catalog の priority count と remaining blocker count を readiness/package に含める。
- [x] docs/CI/Taskfile/admin report を同期する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:source:check` が source catalog、traceability、draft checklist の同期を検査して pass する。
- `npm run acceptance:check` と `npm run acceptance:package:check` が catalog 由来の ID/件数を検査する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- task 完了後、PR コメントと作業レポートを残す。

## 受け入れ条件

- AC-004: draft checklist が元検収 checklist の全 ID を欠落なく含むことを機械検査できる。
- AC-150/151/152: P0/P1/P2 の集計が元検収 checklist の重要度から算出され、残 `requires_aws` の集計に反映される。
- AC-153: defect gate と合わせ、source catalog の全行が final acceptance package の対象であることを確認できる。

## 検証計画

- `npm run acceptance:source:check`
- `npm run acceptance:check`
- `npm run acceptance:external-actions:build`
- `npm run acceptance:external-actions:check`
- `npm run acceptance:final:build`
- `npm run acceptance:final:check`
- `npm run acceptance:package:build`
- `npm run acceptance:package:check`
- `npm run ci:check`
- `npm run docs:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- source catalog は `.workspace` の検収チェックリスト v1.0 から作る snapshot であり、元ファイル更新時は明示的な再同期が必要。
- 実 Git tag/release、AWS deploy/publish、CloudFormation capture、final signoff は確認必須の外部作業として残る。
