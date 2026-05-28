# AWS dev/UAT 検証 runbook

## 目的

AWS dev/UAT で E2E、性能、RAG 品質検証を開始する前に、Saphnexa の実接続成果物が揃っていることを確認する。

この runbook は、local fixture の pass を最終検収 evidence として扱わない。最終検証では、実 AWS から取得した値を `dist/acceptance/aws_dev_uat_preflight.json` に記録し、`npm run aws:dev-uat:preflight:final` を通す。
E2E、性能、RAG 品質検証の実行結果は `dist/acceptance/aws_dev_uat_validation.json` に記録し、`npm run aws:dev-uat:validation:final` と各 suite gate を通す。

## 前提

- 対象環境は `dev` または `uat`。
- AWS region は `ap-northeast-1`。
- Git tag と GitHub release は、検証対象の commit と一致している。
- CDK deploy、Flyway apply、Docusaurus publish、Allure publish、Bedrock KB / S3 Vectors / AgentCore 接続確認が完了している。

## 証跡ファイル

最終証跡の保存先:

```text
dist/acceptance/aws_dev_uat_execution_bridge.json
dist/acceptance/aws_dev_uat_preflight.json
dist/acceptance/aws_dev_uat_validation.json
```

構造確認用の fixture:

```text
docs/acceptance/evidence/aws_dev_uat_preflight.example.json
docs/acceptance/evidence/aws_dev_uat_validation.example.json
docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json
docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json
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
| E2E | 主要 E2E 6 flow、Allure run URL、CloudFront access log |
| 性能 | 非AI API p95、error rate、質問開始 p95、RAG 初回通知 p95、最終回答 p95、timeout rate |
| RAG 品質 | golden dataset、Bedrock Evaluations job、recall@10、citation precision、groundedness、refusal accuracy、unsupported claim rate |

## raw input provenance

`npm run aws:dev-uat:preflight:build` と `npm run aws:dev-uat:validation:build` の raw input は `capture_provenance` を必須とする。`capture_provenance.source` は `aws-dev-uat-raw-capture`、`capture_provenance.captured_at` は JST timestamp、各 `commands[].status` は `captured` とする。

preflight raw input では次の command ID をすべて含める。

```text
aws-sts
cloudformation-describe-stacks
cloudformation-list-stack-resources
flyway-info
hono-openapi
edge-realtime
rag-runtime
published-artifacts
```

validation raw input では次の command ID をすべて含める。

```text
e2e-allure
cloudfront-access-log
performance-report
cloudwatch-dashboard
rag-quality-report
bedrock-evaluation-job
```

`capture_provenance` は builder output の `capture_provenance` に引き継がれる。raw input に provenance がない場合は builder が fail し、final evidence を作成しない。
各 `commands[].output_ref` は raw input ファイルからの相対パスで、参照先ファイルが存在する必要がある。絶対パスと `..` によるディレクトリ traversal は使用しない。

## 手順

1. 実 AWS dev/UAT へ deploy / publish / migration を行う。
2. CloudFormation outputs、DSQL/Flyway 結果、公開 URL、RAG runtime ID を収集する。
3. AWS 認証と final evidence file の準備状況を read-only probe で記録する。

```bash
npm run aws:dev-uat:execution-bridge:probe
```

4. 実 AWS raw capture input から `dist/acceptance/aws_dev_uat_preflight.json` を生成する。

```bash
npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>
```

5. 次を実行する。

```bash
npm run aws:dev-uat:preflight:final
```

6. pass 後に AWS dev/UAT E2E、性能、RAG 品質検証へ進む。
7. 実 AWS dev/UAT で主要 E2E、負荷試験、RAG 品質評価を実行し、raw result input から `dist/acceptance/aws_dev_uat_validation.json` を生成する。

```bash
npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>
```

8. 次を実行する。

```bash
npm run test:e2e:aws
npm run perf:aws
npm run rag:quality:aws
npm run aws:dev-uat:validation:final
```

## 検証

### local 構造確認

実 AWS 証跡を作成する前に、checker と fixture の整合だけを確認する場合は次を実行する。

```bash
npm run aws:dev-uat:preflight
npm run aws:dev-uat:execution-bridge:check
npm run aws:dev-uat:validation:check
npm run aws:dev-uat:validation:fixture:check
npm run aws:dev-uat:evidence:fixture:check
```

この command は `docs/acceptance/evidence/aws_dev_uat_preflight.example.json` を検査する。`fixture` 証跡なので最終検収や AWS dev/UAT 実行完了の根拠にはしない。
`npm run aws:dev-uat:execution-bridge:check` は AWS STS probe を行わず、final evidence path、AWS identity probe command、final gate command order、必要 input、証跡 mapping の整合を検査する。`npm run aws:dev-uat:execution-bridge:probe` は `aws sts get-caller-identity --output json` を read-only で実行し、credentials がなければ `waiting_for_external_execution` として `dist/acceptance/aws_dev_uat_execution_bridge.json` に記録する。
`npm run aws:dev-uat:validation:check` も `docs/acceptance/evidence/aws_dev_uat_validation.example.json` だけを検査する。`npm run aws:dev-uat:validation:fixture:check` は fixture の positive path と、final 指定・E2E失敗・性能閾値超過・RAG品質閾値超過の negative path を検査する。
`npm run aws:dev-uat:evidence:fixture:check` は `*.capture.sample.json` から一時ディレクトリに `aws-captured` evidence を生成し、既存 final checker に通す。sample raw input は最終検収 evidence として扱わない。

## fail 時の扱い

- placeholder、pending、localhost、private IP、`.local`、`.test`、`.internal` が含まれる場合は fail。
- `evidence_class: fixture` のまま `npm run aws:dev-uat:preflight:final` を実行した場合は fail。
- `evidence_class: fixture` のまま `npm run test:e2e:aws`、`npm run perf:aws`、`npm run rag:quality:aws`、`npm run aws:dev-uat:validation:final` を実行した場合は fail。
- いずれかの領域の `status` が期待値ではない場合は fail。
- E2E pass 100%、非AI API p95 <= 800ms、error rate < 1%、質問開始 p95 <= 2s、RAG 初回通知 p95 <= 5s、最終回答 p95 <= 60s、timeout rate < 2%、RAG 品質閾値を満たさない場合は fail。
- fail した状態では、AWS dev/UAT E2E・性能・RAG 品質検証を完了扱いにしない。

## 関連コマンド

```bash
npm run aws:dev-uat:preflight
npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>
npm run aws:dev-uat:execution-bridge:check
npm run aws:dev-uat:execution-bridge:probe
npm run aws:dev-uat:preflight:final
npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>
npm run aws:dev-uat:validation:check
npm run aws:dev-uat:validation:fixture:check
npm run aws:dev-uat:evidence:fixture:check
npm run aws:dev-uat:validation:final
npm run test:e2e:aws
npm run perf:aws
npm run rag:quality:aws
npm run acceptance:external-actions:check
npm run acceptance:final:check
```
