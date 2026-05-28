# 作業完了レポート

保存先: `reports/working/20260528-1208-aws-dev-uat-raw-provenance.md`

## 1. 受けた指示

- 主な依頼: 基本設計 v0.17 package をもとに 1〜6 を本実装として進め、7「AWS dev/UAT E2E・性能・RAG品質検証」ができるようにする。
- 今回の作業範囲: final evidence builder の raw input に capture provenance を必須化し、実 AWS 証跡由来の監査性を高める。
- 条件: 実施していない AWS deploy、Flyway apply、publish、E2E、性能、RAG品質評価を完了済みとして書かない。

## 2. 要件整理

| 要件ID | 指示・要件 | 対応状況 |
|---|---|---|
| R1 | preflight raw input の capture provenance を必須化する | 対応 |
| R2 | validation raw input の capture provenance を必須化する | 対応 |
| R3 | builder output に `capture_provenance` を含める | 対応 |
| R4 | provenance 欠落時に builder/checker が fail する | 対応 |
| R5 | docs と local verification を同期する | 対応 |

## 3. 検討・判断したこと

- 既存 final checker は生成後の evidence を検査するが、raw input の取得元・取得コマンドは検査対象外だった。
- `capture_provenance` を builder の必須入力にして、preflight では AWS STS、CloudFormation、Flyway、OpenAPI、Edge、RAG runtime、publish artifact の取得を、validation では E2E、CloudFront log、performance、CloudWatch、RAG quality、Bedrock evaluation job の取得を明示させた。
- provenance は真正性の補助証跡であり、実 AWS credentials と raw output 本体がない状態では最終検収 evidence にはならない。その境界を docs/report に残した。

## 4. 実施した作業

- `tools/aws-dev-uat-evidence-builders.js` に `capture_provenance` 必須検査を追加した。
- builder output に `capture_provenance` を引き継ぐようにした。
- preflight / validation capture sample に required command IDs、取得 command、output ref、status を追加した。
- `tools/check-aws-dev-uat-evidence-builders.js` に provenance 保持と provenance 欠落 negative path を追加した。
- `docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` に provenance 要件を追記した。

## 5. 成果物

| 成果物 | 形式 | 内容 |
|---|---|---|
| `tools/aws-dev-uat-evidence-builders.js` | Node module | capture provenance 必須検査と output 引き継ぎ |
| `tools/check-aws-dev-uat-evidence-builders.js` | Node checker | provenance positive / negative fixture check |
| `docs/acceptance/evidence/*.capture.sample.json` | JSON | raw input provenance sample |
| `docs/ops/runbooks/aws-dev-uat-validation.md` | Markdown | raw input provenance 要件 |

## 6. 指示へのfit評価

総合fit: 4.2 / 5.0（約84%）

理由: 7 の final evidence 作成時に、raw input の取得コマンドと output ref を検査できるようになった。ただし AWS credentials が未設定のため、実 AWS dev/UAT の raw output 本体はまだ取得できていない。

## 7. 実行した検証

- `npm run aws:dev-uat:evidence:fixture:check`: pass
- `npm run aws:dev-uat:preflight:build -- --input docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json --output /tmp/saphnexa-aws-dev-uat-preflight.json`: pass
- `npm run aws:dev-uat:validation:build -- --input docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json --output /tmp/saphnexa-aws-dev-uat-validation.json`: pass
- `node tools/check-aws-dev-uat-preflight.js /tmp/saphnexa-aws-dev-uat-preflight.json --require-final`: pass
- `node tools/check-aws-dev-uat-validation.js /tmp/saphnexa-aws-dev-uat-validation.json --require-final`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail。理由: credentials 未設定

## 8. 未対応・制約・リスク

- 実 AWS credentials がないため、実 AWS dev/UAT の deploy、Flyway apply、Docusaurus/Allure publish、CloudFront/Cognito/AppSync 実疎通、Bedrock KB / S3 Vectors / AgentCore invoke、E2E、性能、RAG品質評価は未実施。
- `capture_provenance` は raw input の取得コマンドを要求するが、実 AWS raw output 本体はこのリポジトリにはまだ存在しない。
- goal 全体を complete にするには、実 AWS raw output を取得し、`dist/acceptance/aws_dev_uat_preflight.json` と `dist/acceptance/aws_dev_uat_validation.json` を生成して final gate を通す必要がある。
