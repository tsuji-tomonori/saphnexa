# external acceptance action plan

- 状態: ready_for_pr_comment
- タスク種別: 機能追加
- 作成日時: 2026-05-27 12:14 JST
- 対象 PR: #1

## 背景

残 `requires_aws` は Git tag/release、AWS deploy/publish、CloudFormation 実 inventory、最終署名 checklist の外部状態変更または検収者確認に依存している。現状の readiness/final candidate validator は未達を検出できるが、外部で実行すべき action の順序・確認事項・対応 AC を機械的に一覧化していない。

## 目的

最終検収に必要な外部 action plan を `dist/acceptance/` に生成し、未実行 action がある限り final ready にならないことを検査する。

## スコープ

- external acceptance action plan build/check を追加する。
- action plan に Git tag/release、AWS deploy/publish、CloudFormation capture、final candidate 作成、最終 checklist 署名を含める。
- 各 action に対象 AC、必要な事前確認、実行者確認要否、候補コマンドを記録する。
- readiness/package/docs/CI/admin report/Taskfile を同期する。
- 実際の Git tag/release、AWS deploy/publish、CloudFormation capture、署名は実行しない。

## 実装チェックリスト

- [x] external action plan build/check script を追加する。
- [x] readiness gate と acceptance package に action plan を含める。
- [x] docs/trace/local verification/CI/admin report/Taskfile を同期する。
- [x] 対象検証と `npm run verify` を通す。
- [ ] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:external-actions:build` が `dist/acceptance/external_action_plan.json` を生成する。
- `npm run acceptance:external-actions:check` が残 AC を全 action に紐づけ、外部状態変更 action を pending かつ `requires_confirmation=true` として検査する。
- readiness gate が external action plan の pending 状態を含める。
- `AC-001/002/004/081/150/151/152` は action plan で追跡されるが、実行未了のため `requires_aws` のまま残る。
- `npm run verify`、`git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-001: Git tag/release/final manifest 作成 action が定義され、確認なしに完了扱いされない。
- AC-002/081: AWS deploy/publish/CloudFormation capture action が定義され、実 AWS 証跡なしに完了扱いされない。
- AC-004/150/151/152: final checklist 署名と全 PASS 判定 action が定義され、未実行なら final ready にならない。

## 検証計画

- `npm run acceptance:external-actions:build`
- `npm run acceptance:external-actions:check`
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

- action plan は実行計画であり、外部状態変更そのものではない。
- release/deploy/publish/署名は確認必須で、このタスクでは実行しない。
