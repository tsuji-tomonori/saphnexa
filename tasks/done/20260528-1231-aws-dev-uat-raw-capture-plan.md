# AWS dev/UAT raw capture plan 追加

状態: done

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

- [x] preflight / validation の raw capture plan を生成できる。
- [x] raw capture plan checker が command id、output ref、build/final command の整合を検査する。
- [x] npm scripts / Taskfile / CI / external action plan / docs が raw capture plan と同期している。
- [x] plan 生成・検査は AWS 外部状態を変更しない。
- [x] `git diff --check`、targeted checks、`npm run verify` が pass する。
- [x] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

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

## 完了記録

- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 実装 commit: `6680a5d`
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4560663863
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4560665872
- 作業レポート: `reports/working/20260528-1231-aws-dev-uat-raw-capture-plan.md`
- 検証:
  - `npm run aws:dev-uat:raw-capture-plan:build`: pass
  - `npm run aws:dev-uat:raw-capture-plan:check`: pass
  - `node tools/build-aws-dev-uat-raw-capture-plan.js --env dev --stack-name saphnexa-dev-app --run-id dev-raw-capture --output /tmp/saphnexa-aws-dev-uat-raw-capture-plan.json`: pass
  - `node tools/check-aws-dev-uat-raw-capture-plan.js /tmp/saphnexa-aws-dev-uat-raw-capture-plan.json`: pass
  - `npm run acceptance:external-actions:check`: pass
  - `npm run ci:check`: pass
  - `npm run docs:check`: pass
  - `npm run aws:dev-uat:evidence:fixture:check`: pass
  - `npm run aws:dev-uat:execution-bridge:check`: pass
  - `npm run acceptance:package:check`: pass
  - `git diff --check`: pass
  - `npm run verify`: pass
- 未実施:
  - 実 AWS dev/UAT deploy / migration / publish / E2E / 性能 / RAG品質評価は AWS credentials と実 raw output がないため未実施。
  - `aws sts get-caller-identity --output json`: credentials 未設定で fail。
