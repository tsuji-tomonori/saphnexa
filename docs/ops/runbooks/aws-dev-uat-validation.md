# AWS dev/UAT 検証 runbook

## 目的

AWS dev/UAT で E2E、性能、RAG 品質検証を開始する前に、Saphnexa の実接続成果物が揃っていることを確認する。

この runbook は、local fixture の pass を最終検収 evidence として扱わない。最終検証では、実 AWS から取得した値を `dist/acceptance/aws_dev_uat_preflight.json` に記録し、`npm run aws:dev-uat:preflight:final` を通す。

## 前提

- 対象環境は `dev` または `uat`。
- AWS region は `ap-northeast-1`。
- Git tag と GitHub release は、検証対象の commit と一致している。
- CDK deploy、Flyway apply、Docusaurus publish、Allure publish、Bedrock KB / S3 Vectors / AgentCore 接続確認が完了している。

## 証跡ファイル

最終証跡の保存先:

```text
dist/acceptance/aws_dev_uat_preflight.json
```

構造確認用の fixture:

```text
docs/acceptance/evidence/aws_dev_uat_preflight.example.json
```

`evidence_class` の扱い:

| 値 | 用途 | final preflight |
|---|---|---|
| `fixture` | repository 内の構造確認用 | fail |
| `aws-captured` | 実 AWS dev/UAT から取得した証跡 | pass 対象 |

## 必須証跡

| 領域 | 必須内容 |
|---|---|
| DSQL / Flyway | DSQL endpoint、Flyway schema history table、最新 migration version、checksum matched |
| Hono / OpenAPI | Hono API endpoint、`/openapi.json` URL、route count、Zod validation enabled |
| CDK / CloudFormation | stack id、stack status、主要 outputs |
| CloudFront / Cognito / AppSync Events | CloudFront URL、Cognito user pool/client、AppSync Events HTTP/WebSocket endpoint、ws-ticket authorizer |
| Bedrock KB / S3 Vectors / AgentCore | Knowledge Base ID、S3 vector bucket/index、AgentCore Runtime ARN、Tools Gateway authorization、ACL precheck |
| Docusaurus / Allure | CloudFront 配下の `/admin/docs/latest/`、version docs、`/admin/test-reports/allure/latest/` |

## 手順

1. 実 AWS dev/UAT へ deploy / publish / migration を行う。
2. CloudFormation outputs、DSQL/Flyway 結果、公開 URL、RAG runtime ID を収集する。
3. `dist/acceptance/aws_dev_uat_preflight.json` を `evidence_class: aws-captured` で作成する。
4. 次を実行する。

```bash
npm run aws:dev-uat:preflight:final
```

5. pass 後に AWS dev/UAT E2E、性能、RAG 品質検証へ進む。

## 検証

### local 構造確認

実 AWS 証跡を作成する前に、checker と fixture の整合だけを確認する場合は次を実行する。

```bash
npm run aws:dev-uat:preflight
```

この command は `docs/acceptance/evidence/aws_dev_uat_preflight.example.json` を検査する。`fixture` 証跡なので最終検収や AWS dev/UAT 実行完了の根拠にはしない。

## fail 時の扱い

- placeholder、pending、localhost、private IP、`.local`、`.test`、`.internal` が含まれる場合は fail。
- `evidence_class: fixture` のまま `npm run aws:dev-uat:preflight:final` を実行した場合は fail。
- いずれかの領域の `status` が期待値ではない場合は fail。
- fail した状態では、AWS dev/UAT E2E・性能・RAG 品質検証を完了扱いにしない。

## 関連コマンド

```bash
npm run aws:dev-uat:preflight
npm run aws:dev-uat:preflight:final
npm run acceptance:external-actions:check
npm run acceptance:final:check
```
