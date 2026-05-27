# final candidate fixture gate

- 状態: doing
- タスク種別: 検証強化
- 作成日時: 2026-05-27 15:31 JST
- 対象 PR: #1

## 背景

`npm run acceptance:final-candidate:check` は final evidence files が未配置の通常状態では `not_ready` を確認する。一方、最終検収直前に final files が配置された場合の ready/invalid 分岐は、実 AWS/GitHub release 証跡を作らない限り通常検証で直接確認されない。

## 目的

外部 state を変更せず、fixture final files で final candidate validator の ready/invalid 分岐を検査し、AC-001/002/004/081/150/151/152 の最終提出 gate が実ファイル配置時にも機能することを確認する。

## スコープ

- final candidate validator を path override 可能にして fixture 検証から再利用する。
- ready fixture と invalid fixture を一時領域に作成する checker を追加する。
- npm scripts / Taskfile / CI / docs を必要範囲で同期する。
- 実 Git tag/release、AWS deploy/publish、CloudFormation capture、final checklist signoff は実行しない。

## 実装チェックリスト

- [x] final candidate validator を fixture 用 path override に対応する。
- [x] ready fixture が `ready=true` になることを検査する。
- [x] invalid fixture が `invalid` になり draft/pending/placeholder を検出することを検査する。
- [x] npm scripts、Taskfile、CI、docs を同期する。
- [x] 対象検証と `npm run verify` を通す。
- [ ] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:final-candidate:fixture:check` が pass する。
- `npm run acceptance:final-candidate:check` が既存の `not_ready` preflight 挙動を維持する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-001: final evidence manifest の Git commit/tag/release/AWS account が fixture で非 placeholder として検査される。
- AC-002: final docs/Allure/test report URL と CloudFormation inventory が fixture で検査される。
- AC-004: final checklist の全行 `結果=PASS`、`証跡リンク`、`確認者`、`確認日` が fixture で検査される。
- AC-081: final CloudFormation inventory が `source=aws-cloudformation-inventory` かつ final eligible であることを fixture で検査する。
- AC-150/151/152: P0/P1/P2 の final checklist PASS 集計前提が fixture で検査される。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- fixture は外部証跡の代替ではなく validator 分岐の検証に限定する。
- 実 final evidence、GitHub release、AWS 証跡は未作成のまま。
