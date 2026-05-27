# acceptance package draft 生成

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 11:25 JST
- 対象 PR: #1

## 背景

検収 trace はローカル検証可能な項目をほぼ `local_verified` に整理済みだが、最終検収に必要な evidence manifest、チェックリスト、defect list はまだ生成・検査されていない。

## 目的

AWS 実環境・release 操作前に、最終提出物の下書きとして acceptance package を生成し、未実施 AWS 項目を過大に PASS 扱いしない検査を追加する。

## スコープ

- `dist/acceptance/` に evidence manifest draft、checklist draft、defect list、summary を生成する。
- 生成物を検査するコマンドを追加する。
- GitHub issue tracker の open issue を確認し、blocker/critical defect 0 件の snapshot を repo に残す。
- release/tag、AWS publish/deploy、CloudFormation inventory 取得は実行しない。

## 実装チェックリスト

- [x] 検収 schema/checklist の必須項目を確認する。
- [x] acceptance package draft 生成スクリプトを追加する。
- [x] acceptance package check を追加する。
- [x] docs/trace/CI/admin report を同期する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:package:build` が `dist/acceptance/` に draft manifest/checklist/defect list/summary を生成する。
- `npm run acceptance:package:check` が全 AC 行、未記入セル 0、requires_aws を PASS 扱いしないこと、blocker/critical defect 0 を検査する。
- `docs/acceptance/defects/open_issues_snapshot.json` に issue tracker 確認結果を保存する。
- `package.json`、`Taskfile.yml`、CI、admin report、docs/trace が同期される。
- `npm run verify`、`git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-001/002/004: final ではなく draft として evidence manifest/checklist/artifact summary を生成でき、未実施 release/AWS 項目を pending として残す。
- AC-153: GitHub issue tracker と defect list の snapshot で Blocker/Critical open defect 0 を確認できる。

## 検証計画

- `npm run acceptance:package:build`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run acceptance:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- 生成物は draft であり、GitHub release / Git tag / AWS account / CloudFormation stack / S3 published URL を確定するものではない。
- release/tag/deploy/publish は確認必須の外部状態変更であり、このスライスでは実行しない。
