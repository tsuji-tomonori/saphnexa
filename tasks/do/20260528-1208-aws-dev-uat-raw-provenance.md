# AWS dev/UAT raw evidence provenance 強化

状態: in_progress

## 背景

AWS dev/UAT final evidence builder は追加済みだが、raw input が実 AWS 由来であることを示す provenance の検査が弱い。final gate は生成後 evidence を検査できる一方、raw input 取得コマンドや取得元が欠けていても builder が動く余地がある。

## 目的

preflight / validation の raw input に capture provenance を必須化し、実 AWS 取得コマンド、実行順、raw 証跡 source を builder output に引き継ぐ。これにより、7 の AWS dev/UAT 実行時に evidence JSON の由来を監査しやすくする。

## タスク種別

機能追加

## スコープ

- preflight raw input に AWS STS、CloudFormation describe-stacks/list-stack-resources、Flyway、OpenAPI、artifact publish、RAG runtime の capture provenance を要求する。
- validation raw input に E2E、performance、RAG quality の capture provenance を要求する。
- builder output に `capture_provenance` を含める。
- fixture check で provenance 欠落の negative path を検査する。
- runbook / local verification / docs check を同期する。
- 実 AWS deploy / migration / publish / E2E / performance / RAG quality は実行しない。

## 実施計画

1. 既存 builder と sample input を確認する。
2. capture provenance schema と検査を builder module に追加する。
3. sample input と fixture check を更新し、欠落時 fail を確認する。
4. runbook / local verification を更新する。
5. targeted checks と `npm run verify` を実行する。
6. commit/push、PR コメント、task done まで進める。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に raw input の provenance 要件を追記する。
- `docs/ops/local-verification.md` に provenance fixture check を明記する。

## 受け入れ条件

- [ ] preflight raw input の capture provenance が必須化され、欠落時に builder/checker が fail する。
- [ ] validation raw input の capture provenance が必須化され、欠落時に builder/checker が fail する。
- [ ] builder output に `capture_provenance` が含まれ、final evidence と raw source の対応を追跡できる。
- [ ] runbook / local verification が provenance 要件と同期している。
- [ ] `git diff --check`、targeted checks、`npm run verify` が pass する。
- [ ] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

## 検証計画

- `npm run aws:dev-uat:evidence:fixture:check`
- `npm run docs:check`
- `npm run acceptance:external-actions:check`
- `npm run acceptance:package:check`
- `git diff --check`
- `npm run verify`

## PR レビュー観点

- provenance が単なるコメントではなく builder の必須入力になっていること。
- sample raw input が実 AWS 完了証跡と誤認されないこと。
- 既存 final checker を bypass していないこと。

## リスク

- provenance は raw input が「どのコマンドで取得されたか」を記録するが、実 AWS credentials がない状態では実コマンド結果そのものの真正性までは証明できない。
- goal 全体完了には、実 AWS 実行と `aws-captured` evidence の final gate pass が引き続き必要である。
