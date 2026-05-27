# final manifest release url schema gate

- 状態: doing
- タスク種別: 検証強化
- 作成日時: 2026-05-27 16:20 JST
- 対象 PR: #1

## 背景

`.workspace` の evidence manifest schema は `github_release_url` を required に含まない。一方、AC-001 と final candidate validator は GitHub release URL を最終証跡として要求している。source schema のチェックサムは維持しつつ、リポジトリ側の final acceptance extension としてこの追加要件を明示する必要がある。

## 目的

final evidence manifest schema に、GitHub release URL が final acceptance 追加必須項目であることを機械検査可能にする。

## スコープ

- evidence manifest schema に `github_release_url` property と final acceptance extension metadata を追加する。
- example manifest に非 final の GitHub release URL placeholder を追加する。
- schema/example checker で source required と final extension required を分けて検査する。
- final candidate validator の既存 GitHub release URL 検査と整合させる。

## 実装チェックリスト

- [x] schema に `github_release_url` property を追加する。
- [x] schema に final acceptance extension metadata を追加する。
- [x] example manifest に non-final GitHub release URL を追加する。
- [x] checker で source required と final extension required を検査する。
- [x] 対象検証と `npm run verify` を通す。
- [ ] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run evidence:check` が source schema metadata と final extension metadata を検査して pass する。
- `npm run acceptance:final-candidate:fixture:check` が GitHub release URL を final candidate として検査して pass する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-001: GitHub release URL が final evidence manifest の追加必須証跡として schema/example/checker に明示される。
- AC-150/151/152: aggregate PASS 前提となる final evidence が GitHub release URL を欠いた状態で通らない。

## 検証計画

- `npm run evidence:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- `.workspace` source schema 自体の required list は変更しない。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
