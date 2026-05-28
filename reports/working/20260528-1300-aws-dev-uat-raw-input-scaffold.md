# AWS dev/UAT raw input scaffold 作業レポート

## 指示

`Saphnexa_基本設計書_v0.17_package.zip` をもとに、DSQL/Flyway、Hono/Zod/OpenAPI、CDK Construct、CloudFront/Cognito/AppSync Events、Bedrock KB/S3 Vectors/AgentCore、Docusaurus/Allure 公開を本実装し、AWS dev/UAT E2E・性能・RAG品質検証へ進める状態にする。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | AWS dev/UAT raw capture plan から raw input scaffold を生成できる | 対応 |
| R2 | scaffold が final evidence と誤認されない | 対応 |
| R3 | command id、command、output_ref が raw capture plan と同期する | 対応 |
| R4 | npm scripts、Taskfile、CI、verify、外部 action plan、docs に反映する | 対応 |
| R5 | 実 AWS dev/UAT E2E・性能・RAG品質検証を完了する | 未対応。AWS credentials 不在 |

## 検討・判断

- final evidence builder は `capture_provenance.commands[].status: captured` と `output_ref` 実体を要求するため、scaffold は `pending_capture` のまま生成し、誤って final gate を通せない設計にした。
- raw capture plan を唯一の command 契約として扱い、scaffold checker は command id、command、output_ref、output_kind の同期を検査する方針にした。
- 実 AWS command は実行せず、ローカル checker はファイル生成と構造検査だけを行うようにした。

## 実施作業

- `tools/aws-dev-uat-raw-input-scaffold.js` を追加し、preflight / validation の raw input scaffold を生成する実装を追加。
- `tools/build-aws-dev-uat-raw-input-scaffold.js` と `tools/check-aws-dev-uat-raw-input-scaffold.js` を追加。
- `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、`tools/check-ci-workflow.js`、`tools/external-acceptance-actions.js`、`tools/check-external-acceptance-actions.js`、`tools/check-docs.js` を更新。
- `docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` に scaffold 手順と制約を追記。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/aws-dev-uat-raw-input-scaffold.js` | raw capture plan 由来の scaffold generator |
| `tools/build-aws-dev-uat-raw-input-scaffold.js` | scaffold build CLI |
| `tools/check-aws-dev-uat-raw-input-scaffold.js` | scaffold 契約 checker |
| `dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json` | 生成対象の preflight scaffold |
| `dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json` | 生成対象の validation scaffold |

## 検証

- `npm run aws:dev-uat:raw-input-scaffold:check`: pass
- `npm run aws:dev-uat:raw-capture-plan:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `task aws:dev-uat:raw-input-scaffold:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail。`Unable to locate credentials.` のため実 AWS identity は未確認。

## Fit 評価

総合fit: 4.3 / 5.0（約86%）

理由: AWS dev/UAT 検証の最終実行に必要な raw input 作成導線は追加できた。実 AWS credentials がないため、dev/UAT E2E・性能・RAG品質検証の完了証跡はまだ作成できていない。

## 未対応・制約・リスク

- AWS credentials がないため、DSQL/Flyway 実適用、CDK deploy、Docusaurus/Allure 実 publish、AWS dev/UAT E2E・性能・RAG品質検証の実行結果は未取得。
- scaffold は `pending_capture` の draft であり、最終検収 evidence ではない。
- operator が実 AWS raw output と `captured_at`、`capture_provenance.commands[].status: captured`、参照先 `output_ref` を揃えるまで final evidence builder には進めない。
