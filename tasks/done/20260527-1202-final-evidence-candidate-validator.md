# final evidence candidate validator

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 12:02 JST
- 対象 PR: #1

## 背景

残 AC の AC-001/002/004/150/151/152 は、最終 `evidence_manifest.json`、公開成果物 URL、CloudFormation 実証跡、最終署名 checklist が揃わない限り完了できない。現状は draft package と readiness gate があるが、実際に final candidate を置いたときに placeholder や draft が混入していないことを検査する契約がまだ不足している。

## 目的

最終検収直前に提出候補の `evidence_manifest.json` と acceptance checklist を機械検査できる validator と運用手順を追加し、draft を final として通さない。

## スコープ

- final evidence candidate 用の schema/check を追加する。
- final checklist candidate 用の schema/check を追加する。
- 候補ファイルが未配置の場合は `not_ready` として明示し、通常の `npm run verify` では draft/preflight として pass させる。
- `package.json`、Taskfile、CI、admin report、docs check、local verification docs、trace/readiness を同期する。
- Git tag/release、AWS deploy/publish、final candidate 作成・署名は実行しない。

## 実装チェックリスト

- [x] final evidence/checklist candidate validator を追加する。
- [x] readiness gate に final candidate validator の結果を含める。
- [x] docs/trace/local verification/CI/admin report/Taskfile を同期する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:final-candidate:check` が final candidate 未配置を `not_ready` として出力し、placeholder/draft を final 扱いしない。
- final candidate が配置された場合に必要となる manifest/checklist の必須フィールド、URL、AWS account、Git tag、CloudFormation stack、署名済み checklist 条件が validator に定義される。
- readiness gate が final candidate の `not_ready` を pending evidence に含める。
- `AC-001/002/004/150/151/152` は実 final candidate 未配置のため `requires_aws` のまま、根拠が validator へ更新される。
- `npm run verify`、`git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-001: final `evidence_manifest.json` が実 Git tag/release/AWS account/stack を含まない限り ready にならない。
- AC-002: final artifact URL と CloudFormation/Flyway/docs/Allure/RAG evidence が揃わない限り ready にならない。
- AC-004: final checklist の全行が PASS、証跡、確認者、確認日を持たない限り ready にならない。

## 検証計画

- `npm run acceptance:final-candidate:check`
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

- final candidate はこのタスクでは作成しない。実値がない状態で PASS させることを避けるため。
- 最終候補ファイルを置く段階では、AWS 実証跡・GitHub release・署名済み checklist が必要。
