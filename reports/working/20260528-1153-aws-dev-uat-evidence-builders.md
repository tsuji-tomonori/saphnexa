# 作業完了レポート

保存先: `reports/working/20260528-1153-aws-dev-uat-evidence-builders.md`

## 1. 受けた指示

- 主な依頼: 基本設計 v0.17 package をもとに 1〜6 を本実装として進め、7「AWS dev/UAT E2E・性能・RAG品質検証」ができるようにする。
- 今回の作業範囲: 実 AWS 実行後の raw 証跡から、final gate が検査できる `aws-captured` evidence JSON を生成する builder を追加する。
- 条件: 実 AWS deploy、Flyway apply、publish、E2E、性能、RAG品質評価を未実施のまま完了扱いにしない。

## 2. 要件整理

| 要件ID | 指示・要件 | 対応状況 |
|---|---|---|
| R1 | raw input から preflight final evidence を生成できる | 対応 |
| R2 | raw input から validation final evidence を生成できる | 対応 |
| R3 | builder output を既存 final gate に通す fixture check がある | 対応 |
| R4 | scripts / Taskfile / CI / docs / external action plan と同期する | 対応 |
| R5 | sample raw input を最終検収 evidence と誤認させない | 対応 |

## 3. 検討・判断したこと

- 既存の final checker は `aws-captured` evidence を厳格に検査できるが、JSON 作成は手作業前提だった。
- builder は final checker を bypass せず、生成後に既存 `aws:dev-uat:preflight:final` / `aws:dev-uat:validation:final` / suite gate で検査する構成にした。
- `npm run aws:dev-uat:preflight:build` と `npm run aws:dev-uat:validation:build` は `--input` 必須にし、sample input を誤って `dist/acceptance` の final evidence として残さないようにした。
- fixture check は一時ディレクトリへ出力し、sample raw input が最終検収 evidence ではないことを runbook / local verification に明記した。

## 4. 実施した作業

- `tools/aws-dev-uat-evidence-builders.js` を追加し、preflight / validation evidence builder を実装した。
- `tools/build-aws-dev-uat-evidence.js` を追加し、`--input` / `--output` 付き CLI を提供した。
- `tools/check-aws-dev-uat-evidence-builders.js` を追加し、sample raw input から生成した output が既存 final checker と suite gate を通ることを検査した。
- `docs/acceptance/evidence/*.capture.sample.json` を追加し、raw input 形式のサンプルを置いた。
- `package.json`、`Taskfile.yml`、CI、external action plan、artifact summary、runbook、local verification docs を同期した。

## 5. 成果物

| 成果物 | 形式 | 内容 |
|---|---|---|
| `tools/aws-dev-uat-evidence-builders.js` | Node module | raw input から `aws-captured` evidence JSON を生成 |
| `tools/build-aws-dev-uat-evidence.js` | Node CLI | preflight / validation evidence build command |
| `tools/check-aws-dev-uat-evidence-builders.js` | Node checker | builder output を既存 final gate で検査 |
| `docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json` | JSON | preflight raw input sample |
| `docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json` | JSON | validation raw input sample |
| `docs/ops/runbooks/aws-dev-uat-validation.md` | Markdown | builder を含む AWS dev/UAT final 手順 |

## 6. 指示へのfit評価

総合fit: 4.1 / 5.0（約82%）

理由: 7 の final evidence 作成が、手作業 JSON ではなく raw 証跡 input から再現可能になった。一方で AWS credentials が未設定で、実 AWS dev/UAT の deploy / migration / publish / E2E / 性能 / RAG品質評価はまだ実行できていない。

## 7. 実行した検証

- `npm run aws:dev-uat:evidence:fixture:check`: pass
- `npm run aws:dev-uat:preflight:build -- --input docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json --output /tmp/saphnexa-aws-dev-uat-preflight.json`: pass
- `npm run aws:dev-uat:validation:build -- --input docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json --output /tmp/saphnexa-aws-dev-uat-validation.json`: pass
- `node tools/check-aws-dev-uat-preflight.js /tmp/saphnexa-aws-dev-uat-preflight.json --require-final`: pass
- `node tools/check-aws-dev-uat-validation.js /tmp/saphnexa-aws-dev-uat-validation.json --require-final`: pass
- `node tools/check-aws-dev-uat-validation.js /tmp/saphnexa-aws-dev-uat-validation.json --suite=e2e --require-final`: pass
- `node tools/check-aws-dev-uat-validation.js /tmp/saphnexa-aws-dev-uat-validation.json --suite=performance --require-final`: pass
- `node tools/check-aws-dev-uat-validation.js /tmp/saphnexa-aws-dev-uat-validation.json --suite=rag-quality --require-final`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run acceptance:package:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail。理由: credentials 未設定

## 8. 未対応・制約・リスク

- 実 AWS credentials がないため、実 AWS dev/UAT の deploy、Flyway apply、Docusaurus/Allure publish、CloudFront/Cognito/AppSync 実疎通、Bedrock KB / S3 Vectors / AgentCore invoke、E2E、性能、RAG品質評価は未実施。
- sample raw input から生成した `/tmp` の evidence は builder 構造確認用であり、最終検収 evidence ではない。
- goal 全体を complete にするには、実 AWS raw input で `dist/acceptance/aws_dev_uat_preflight.json` と `dist/acceptance/aws_dev_uat_validation.json` を生成し、final gate と suite gate を通す必要がある。
