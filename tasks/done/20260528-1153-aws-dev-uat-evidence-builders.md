# AWS dev/UAT final evidence builder 追加

状態: done

## 背景

PR #2 では AWS dev/UAT の final evidence gate と execution bridge が追加済みである。一方で、`dist/acceptance/aws_dev_uat_preflight.json` と `dist/acceptance/aws_dev_uat_validation.json` は手作成前提であり、実 AWS 実行後の raw 証跡から final evidence JSON へ変換する repo 内導線が不足している。

## 目的

実 AWS dev/UAT で取得した CloudFormation outputs、AWS identity、Flyway、Hono/OpenAPI、Edge、RAG runtime、公開 artifact、E2E、性能、RAG品質の raw 証跡から、final gate が検査できる `aws-captured` evidence JSON を生成する builder と fixture check を追加する。

## タスク種別

機能追加

## スコープ

- preflight evidence input から `dist/acceptance/aws_dev_uat_preflight.json` を生成する builder を追加する。
- validation evidence input から `dist/acceptance/aws_dev_uat_validation.json` を生成する builder を追加する。
- fixture input と checker を追加し、builder output が既存 final gate を通ることを検査する。
- npm scripts / Taskfile / CI / runbook / local verification / external action plan を更新する。
- 実 AWS deploy、migration、publish、E2E、性能、RAG品質評価自体は実行しない。

## 実施計画

1. 既存 evidence gate の要求 schema を source of truth として確認する。
2. raw input schema を最小化し、CloudFormation outputs 由来の値を可能な限り自動展開する。
3. builder / fixture / checker を追加する。
4. docs と scripts を同期する。
5. targeted checks と `npm run verify` を実行する。
6. PR コメント、task done、commit/push まで進める。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に evidence builder 手順と input path を追記する。
- `docs/ops/local-verification.md` に fixture builder check と未実施の境界を追記する。

## 受け入れ条件

- [x] raw input から `aws-captured` preflight evidence を生成でき、既存 final preflight checker を通る fixture check がある。
- [x] raw input から `aws-captured` validation evidence を生成でき、既存 final suite checker を通る fixture check がある。
- [x] builder は fixture/example/pending/localhost を final evidence に混入させない既存 checker と接続されている。
- [x] npm scripts / Taskfile / CI / runbook / local verification / external action plan が builder と同期している。
- [x] `git diff --check`、targeted checks、`npm run verify` が pass する。
- [x] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

## 検証計画

- `npm run aws:dev-uat:evidence:fixture:check`
- `npm run aws:dev-uat:preflight:build`
- `npm run aws:dev-uat:validation:build`
- `npm run aws:dev-uat:preflight:final`
- `npm run aws:dev-uat:validation:final`
- `npm run test:e2e:aws`
- `npm run perf:aws`
- `npm run rag:quality:aws`
- `npm run docs:check`
- `npm run acceptance:external-actions:check`
- `npm run acceptance:package:check`
- `git diff --check`
- `npm run verify`

## PR レビュー観点

- builder が existing final gate を bypass せず、既存 checker を通していること。
- fixture は builder の構造確認であり、実 AWS 検証完了と誤認しないこと。
- 実 AWS 外部状態を変更する command を自動実行しないこと。

## リスク

- 実 AWS credentials と raw 証跡がないため、builder の実入力はまだ fixture でしか検査できない。
- final evidence の信頼性は、builder への raw input が実 AWS 由来であることに依存するため、runbook と PR コメントで境界を明記する。

## 完了記録

- 実装 commit: `6bb2257`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4560497493
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4560500160
- 作業レポート: `reports/working/20260528-1153-aws-dev-uat-evidence-builders.md`
- 実行した検証: `npm run aws:dev-uat:evidence:fixture:check`, `npm run aws:dev-uat:preflight:build -- --input docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json --output /tmp/saphnexa-aws-dev-uat-preflight.json`, `npm run aws:dev-uat:validation:build -- --input docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json --output /tmp/saphnexa-aws-dev-uat-validation.json`, final checker suite, `npm run ci:check`, `npm run docs:check`, `npm run acceptance:external-actions:check`, `npm run acceptance:package:check`, `git diff --check`, `npm run verify`
- 未実施: 実 AWS deploy / migration / publish / E2E / 性能 / RAG品質評価。理由は AWS credentials と実 raw 証跡が未準備。
