# AWS dev/UAT preflight 実行導線

## 背景

ユーザーは `.workspace/Saphnexa_基本設計書_v0.17_package.zip` をもとに、1. DSQL / Flyway 実適用、2. Hono + Zod + OpenAPI 本実装、3. CDK 実 Construct 化、4. CloudFront / Cognito / AppSync Events 実結合、5. Bedrock KB / S3 Vectors / AgentCore 実結合、6. Docusaurus / Allure 公開まで進め、7. AWS dev/UAT E2E・性能・RAG 品質検証ができる状態にすることを依頼している。

現状の `docs/ops/local-verification.md` と `docs/acceptance/traceability.md` では、多くの項目が local verified または requires_aws として整理済みだが、AWS dev/UAT 実接続に進むための環境出力契約と preflight gate が不足している。

## 目的

AWS dev/UAT の E2E・性能・RAG 品質検証を実行する前に、1-6 の実接続成果物が揃っていることを機械的に確認できる導線を追加する。

## スコープ

- dev/UAT 環境に必要な CloudFormation output / 公開 URL / Bedrock・S3 Vectors・AgentCore / DSQL / Flyway / Cognito / AppSync Events / Docusaurus / Allure の証跡項目を定義する。
- 証跡 JSON を検証する `npm` script と Node tool を追加する。
- operator 向け runbook と local verification docs を更新する。
- 実 AWS deploy、Flyway 実適用、Docusaurus/Allure の実 publish、E2E/performance/RAG quality 実行は、この turn では外部認証情報と AWS 環境がないため実施しない。ただし未実施を pass にしない。

## タスク種別

機能追加

## 計画

1. 既存の acceptance/verification 構成に合わせて dev/UAT preflight tool を追加する。
2. tool が必須 field、URL 形式、環境名、AWS account/region、検証項目の status を厳格に検査する。
3. package scripts と Taskfile target を追加する。
4. docs/ops に実行手順と未実施時の扱いを追記する。
5. 変更範囲に対応する検証を実行する。

## ドキュメント保守計画

- `docs/ops/local-verification.md` に preflight で確認できることと未完了扱いを追記する。
- 新規 runbook `docs/ops/runbooks/aws-dev-uat-validation.md` を追加し、証跡 JSON の作り方、実行順序、未達時の扱いを記載する。

## 受け入れ条件

- `npm run aws:dev-uat:preflight` が追加され、既定の example 証跡で pass する。
- `tools/check-aws-dev-uat-preflight.js` が dev/UAT 検証前提の必須項目を不足・placeholder・失敗 status で fail させる。
- preflight の対象に DSQL/Flyway、Hono/OpenAPI、CDK/CloudFormation、CloudFront/Cognito/AppSync Events、Bedrock KB/S3 Vectors/AgentCore、Docusaurus/Allure が含まれる。
- `docs/ops/runbooks/aws-dev-uat-validation.md` に実行手順と AWS 実行が未完了の場合の扱いが記載される。
- 変更範囲に対して `npm run aws:dev-uat:preflight`、`npm run docs:check`、`git diff --check` を実行し、結果を記録する。

## 検証計画

- `npm run aws:dev-uat:preflight`
- `npm run docs:check`
- `git diff --check`

## 実施結果

- `tools/check-aws-dev-uat-preflight.js` を追加し、AWS dev/UAT 証跡 gate を実装した。
- `docs/acceptance/evidence/aws_dev_uat_preflight.example.json` を追加し、fixture 構造を検査できるようにした。
- `package.json` と `Taskfile.yml` に `aws:dev-uat:preflight` / `aws:dev-uat:preflight:final` を追加した。
- `docs/ops/runbooks/aws-dev-uat-validation.md` を追加し、実 AWS 証跡収集と final preflight の手順を記載した。
- `docs/ops/local-verification.md` と `tools/check-docs.js` を更新し、fixture と final 証跡の違いを検査対象にした。

## 検証結果

- `npm run aws:dev-uat:preflight`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `node tools/check-aws-dev-uat-preflight.js docs/acceptance/evidence/aws_dev_uat_preflight.example.json --require-final`: expected fail。fixture を final evidence として拒否することを確認。

## 作業レポート

- `reports/working/20260528-0855-aws-dev-uat-preflight.md`

## PR レビュー観点

- 未実施の AWS deploy / publish / E2E を pass と誤認させていないこと。
- placeholder や local-only 値が dev/UAT 証跡として通らないこと。
- DSQL、RAG、公開成果物、認証・通知境界の証跡が 7 の実行前提として揃っていること。

## リスク

- 実 AWS 環境と認証情報がないため、今回の preflight は証跡入力の検証までで、deploy や E2E の実行完了は証明しない。
- AWS サービスの CloudFormation output 名や実運用の artifact URL 命名が今後変わる場合、preflight schema の更新が必要になる。

## 状態

in_progress
