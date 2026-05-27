# final acceptance readiness gate

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 11:52 JST
- 対象 PR: #1

## 背景

検収 trace の残件は AC-001/002/004/081 と、それに依存する AC-150/151/152 に集約された。これらは Git tag/release、AWS deploy/publish、CloudFormation 実 inventory、最終署名 checklist が必要で、ローカルだけでは完了扱いにできない。

## 目的

最終検収の完了判定を機械的に監査できる readiness gate を追加し、未実施の release/AWS/署名 checklist がある限り `final_acceptance_ready=false` であることを検査する。

## スコープ

- `dist/acceptance/final_readiness.json` を生成する。
- final readiness check で残 `requires_aws`、pending evidence、draft manifest、未確定 tag/account/stack/publish URL を検査する。
- acceptance package draft に readiness summary を含める。
- local verification docs、Taskfile、CI、admin report、trace を同期する。
- Git tag/release 作成、AWS deploy/publish、最終 checklist 署名は実行しない。

## 実装チェックリスト

- [x] final readiness build/check script を追加する。
- [x] acceptance package draft に final readiness を含める。
- [x] docs/trace/local verification/CI/admin report/Taskfile を同期する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:final:build` が `dist/acceptance/final_readiness.json` を生成する。
- `npm run acceptance:final:check` が残 `requires_aws`、AC-150/151/152 の未達、draft manifest、pending release/AWS/publish/checklist を検査し、未達を PASS 扱いしない。
- `npm run acceptance:package:build` / `npm run acceptance:package:check` が final readiness summary を含めて検査する。
- `AC-001/002/004/081/150/151/152` は実 AWS/release/署名が未完了であるため `requires_aws` のまま、根拠が readiness gate へ更新される。
- `npm run verify`、`git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-001: final manifest が Git tag/release/AWS account/stack を確定するまで ready にならないことを検査できる。
- AC-004: checklist の `PENDING_AWS` が残る限り ready にならないことを検査できる。
- AC-150/151/152: P0/P1/P2 の全 PASS が未達なら ready にならないことを検査できる。

## 検証計画

- `npm run acceptance:final:build`
- `npm run acceptance:final:check`
- `npm run acceptance:package:build`
- `npm run acceptance:package:check`
- `npm run ci:check`
- `npm run docs:check`
- `npm run acceptance:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- この gate は最終検収の readiness を監査するためのもので、Git tag/release/AWS deploy/publish/checklist 署名を代替しない。
- 外部状態変更は実行しないため、ゴール全体の完了条件はまだ満たさない。
