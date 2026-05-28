# AWS dev/UAT raw capture plan 追加

状態: in_progress

## 背景

AWS dev/UAT final evidence builder は raw input と raw output ref を検査できるようになった。一方で、実 AWS 実行時にどの command を実行し、どの raw output file に保存し、どの builder/final gate に渡すかを機械的に生成・検査する導線がまだ弱い。

## 目的

preflight / validation の raw capture plan を生成・検査する CLI を追加し、AWS credentials が用意された後に必要な raw output files と final gate command を迷わず実行できる状態へ近づける。

## タスク種別

機能追加

## スコープ

- raw capture plan の source module と CLI を追加する。
- raw capture plan checker を追加し、command id、output ref、build/final command の整合を検査する。
- npm scripts / Taskfile / CI / docs / external action plan を同期する。
- 実 AWS command の実行、deploy、migration、publish、E2E、性能、RAG品質評価は実行しない。

## 実施計画

1. 既存 raw input / builder / runbook の command id と output ref を確認する。
2. raw capture plan builder/checker を追加する。
3. npm scripts / Taskfile / CI / docs / external action plan を同期する。
4. targeted checks と `npm run verify` を実行する。
5. report、commit/push、PR コメント、task done まで進める。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に raw capture plan の生成・確認手順を追記する。
- `docs/ops/local-verification.md` に raw capture plan check の位置づけを追記する。

## 受け入れ条件

- [ ] preflight / validation の raw capture plan を生成できる。
- [ ] raw capture plan checker が command id、output ref、build/final command の整合を検査する。
- [ ] npm scripts / Taskfile / CI / external action plan / docs が raw capture plan と同期している。
- [ ] plan 生成・検査は AWS 外部状態を変更しない。
- [ ] `git diff --check`、targeted checks、`npm run verify` が pass する。
- [ ] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

## 検証計画

- `npm run aws:dev-uat:raw-capture-plan:check`
- `npm run aws:dev-uat:raw-capture-plan:build`
- `npm run docs:check`
- `npm run acceptance:external-actions:check`
- `npm run acceptance:package:check`
- `git diff --check`
- `npm run verify`

## PR レビュー観点

- raw capture plan が final evidence builder の required command ids と同期していること。
- 実 AWS 操作を自動実行しないこと。
- plan が sample/fixture を最終検収 evidence と誤認させないこと。

## リスク

- plan は実行手順の機械化であり、実 AWS output の取得や真正性を証明しない。
- AWS credentials がないため、実 dev/UAT final evidence の作成は引き続き未実施である。
