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
dist/acceptance/aws_dev_uat_raw_capture_plan.json
dist/acceptance/aws_dev_uat_operator_input.scaffold.json
dist/acceptance/aws_dev_uat_operator_input.json
dist/acceptance/aws_dev_uat_operator_execution_runbook.json
dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json
dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json
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

4. raw capture plan を生成・検査し、必要な command id、raw output file、preflight / validation materializer、build/final gate の対応を確認する。

```bash
npm run aws:dev-uat:raw-capture-plan:build
npm run aws:dev-uat:raw-capture-plan:check
npm run aws:dev-uat:raw-input-scaffold:build
npm run aws:dev-uat:raw-input-scaffold:check
npm run aws:dev-uat:operator-input:build
npm run aws:dev-uat:operator-input:check
npm run aws:dev-uat:operator-runbook:check
npm run aws:dev-uat:capture-helpers:check
```

`edge-realtime`、`rag-runtime`、`published-artifacts` の raw output は repo 内 helper で取得する。helper は実環境値を env から受け取り、必須 env がない場合は fail する。架空値や fallback 成功は出さない。

`npm run aws:dev-uat:raw-input-scaffold:build` は raw capture plan から次の draft input を生成する。

```text
dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json
dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json
```

scaffold は `schema_version: saphnexa-aws-dev-uat-raw-input-scaffold.v1`、`scaffold_status: requires_operator_values`、`final_evidence: false`、`capture_provenance.commands[].status: pending_capture` のまま出力される。preflight scaffold は `materialization.command` に raw output files から final preflight raw input を生成する command を持つ。validation scaffold は `materialization.command` に raw output files から final validation raw input を生成する command を持つ。実 AWS raw output を取得し、必要値、`captured_at`、`capture_provenance.captured_at`、各 `output_ref` の参照先ファイルを揃えたうえで、operator が final raw input として別名保存する。scaffold そのものは `npm run aws:dev-uat:preflight:final` や `npm run aws:dev-uat:validation:final` の根拠にしない。

`npm run aws:dev-uat:operator-input:check` は `dist/acceptance/aws_dev_uat_operator_input.scaffold.json` を生成し、release tag、GitHub release URL、AWS account id、admin artifacts bucket、test run id、Bedrock evaluation job、report URL、resolved command の必須入力を 1 つの operator input として列挙する。operator は値を確定した後、`dist/acceptance/aws_dev_uat_operator_input.json` に保存し、raw input materialization の前に resolved operator input を検査する。

```bash
npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved
```

resolved operator input checker は `<release-tag>`、`<aws-account-id>`、`sample`、`mock`、`localhost`、空値、不正な GitHub release URL、不正な AWS account id を reject する。`command_templates` は未解決 placeholder を含むテンプレートとして保持してよいが、`resolved_commands` は実値に置き換える。operator input scaffold は実 AWS 完了 evidence ではない。

resolved operator input が pass したら、外部実行前に operator execution runbook を生成・検査する。runbook は release、deploy_publish、preflight_capture、preflight_materialization、validation_capture、validation_materialization、final_gates、final_acceptance の順序、各 phase の `requires_confirmation`、`stop_on_failure`、証跡出力を固定する。未解決 operator input では `requires_resolved_operator_input` のまま残り、resolved mode では `<...>`、`sample`、`mock`、`localhost` を含む command を reject する。

```bash
npm run aws:dev-uat:operator-runbook:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved
```

operator execution runbook は command を実行しない。release 作成、deploy、migration、publish、E2E、負荷試験、Bedrock Evaluations、signoff には別途 operator の確認が必要であり、runbook だけでは AWS dev/UAT 完了 evidence にならない。

operator が final raw input を保存したら、`dist/acceptance/` の final evidence を更新する前に dry-run checker を実行する。dry-run checker は一時ディレクトリに evidence を生成し、既存 final gate を通す。scaffold、`pending_capture`、`captured_at` 未設定、`output_ref` 参照先欠落、閾値未達は fail する。

```bash
npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>
```

raw output checker は `capture_provenance.commands[].output_ref` の参照先を raw input ファイルからの相対パスとして解決し、preflight / validation の command id ごとの期待形式を検査する。JSON output は parse 可能で空でない object / array、text output は空でない file である必要がある。通常実行では `sample`、`fixture`、`mock`、`localhost` などの text を含む raw output は fail する。

| helper | 必須 env |
|---|---|
| `node tools/capture-edge-realtime-smoke.js` | `SAPHNEXA_CLOUDFRONT_URL`, `SAPHNEXA_COGNITO_USER_POOL_ID`, `SAPHNEXA_COGNITO_USER_POOL_CLIENT_ID`, `SAPHNEXA_APPSYNC_EVENT_API_HTTP_ENDPOINT`, `SAPHNEXA_APPSYNC_EVENT_API_REALTIME_ENDPOINT` |
| `node tools/capture-rag-runtime-smoke.js` | `SAPHNEXA_BEDROCK_KNOWLEDGE_BASE_ID`, `SAPHNEXA_S3_VECTOR_BUCKET_NAME`, `SAPHNEXA_S3_VECTOR_INDEX_NAME`, `SAPHNEXA_AGENTCORE_RUNTIME_ARN`, `SAPHNEXA_TOOLS_API_URL` |
| `node tools/capture-admin-artifacts-smoke.js` | `SAPHNEXA_DOCUSAURUS_LATEST_URL`, `SAPHNEXA_DOCUSAURUS_VERSION_URL`, `SAPHNEXA_ALLURE_LATEST_URL`; signed-cookie 保護された artifact では `SAPHNEXA_CLOUDFRONT_COOKIE` も指定する |
| `node tools/capture-aws-dev-uat-e2e-result.js` | `SAPHNEXA_E2E_PASSED_FLOWS`, `SAPHNEXA_E2E_TOTAL_FLOWS`, `SAPHNEXA_ALLURE_RUN_URL` |
| `node tools/capture-aws-dev-uat-performance-result.js` | `SAPHNEXA_PERF_NON_AI_API_P95_MS`, `SAPHNEXA_PERF_ERROR_RATE`, `SAPHNEXA_PERF_QUESTION_START_P95_MS`, `SAPHNEXA_PERF_RAG_FIRST_NOTICE_P95_MS`, `SAPHNEXA_PERF_FINAL_ANSWER_P95_MS`, `SAPHNEXA_PERF_TIMEOUT_RATE`, `SAPHNEXA_PERF_REPORT_URL` |
| `node tools/capture-aws-dev-uat-rag-quality-result.js` | `SAPHNEXA_RAG_GOLDEN_DATASET`, `SAPHNEXA_RAG_EVALUATION_JOB_ID`, `SAPHNEXA_RAG_BEDROCK_EVALUATION_JOB_ARN`, `SAPHNEXA_RAG_RECALL_AT_10`, `SAPHNEXA_RAG_CITATION_PRECISION`, `SAPHNEXA_RAG_GROUNDEDNESS`, `SAPHNEXA_RAG_REFUSAL_ACCURACY`, `SAPHNEXA_RAG_UNSUPPORTED_CLAIM_RATE`, `SAPHNEXA_RAG_REPORT_URL` |

5. 実 AWS dev/UAT の raw output files と scaffold から final preflight raw input を生成し、`dist/acceptance/aws_dev_uat_preflight.json` を生成する。

```bash
npm run aws:dev-uat:preflight-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json --output <raw-preflight-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url>
npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>
```

6. 次を実行する。

```bash
npm run aws:dev-uat:preflight:final
```

7. pass 後に AWS dev/UAT E2E、性能、RAG 品質検証を外部実行し、結果 URL / metrics / Bedrock Evaluation Job を確定してから raw output を取得する。

```bash
node tools/capture-aws-dev-uat-e2e-result.js --env uat --run-id <run-id> > raw/e2e-allure-run.json
aws s3 ls s3://saphnexa-uat-logs/cloudfront/<run-id>/ --region ap-northeast-1 > raw/cloudfront-access-log-list.txt
node tools/capture-aws-dev-uat-performance-result.js --env uat --run-id <run-id> > raw/performance-report.json
aws cloudwatch get-dashboard --dashboard-name saphnexa-uat --region ap-northeast-1 > raw/cloudwatch-dashboard.json
node tools/capture-aws-dev-uat-rag-quality-result.js --env uat --run-id <run-id> > raw/rag-quality-report.json
aws bedrock get-evaluation-job --job-identifier rag-eval-<run-id> --region ap-northeast-1 > raw/bedrock-evaluation-job.json
```

8. 実 AWS dev/UAT の raw output files と scaffold から final validation raw input を生成し、`dist/acceptance/aws_dev_uat_validation.json` を生成する。

```bash
npm run aws:dev-uat:validation-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json --output <raw-validation-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url> --aws-account-id <aws-account-id>
npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>
npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>
npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>
```

9. suite gate、final gate、evidence bundle manifest を作成する。

```bash
npm run test:e2e:aws
npm run perf:aws
npm run rag:quality:aws
npm run aws:dev-uat:validation:final
npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input <raw-preflight-input.json> --validation-raw-input <raw-validation-input.json> --preflight-evidence dist/acceptance/aws_dev_uat_preflight.json --validation-evidence dist/acceptance/aws_dev_uat_validation.json --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json
```

## 検証

### local 構造確認

実 AWS 証跡を作成する前に、checker と fixture の整合だけを確認する場合は次を実行する。

```bash
npm run aws:dev-uat:preflight
npm run aws:dev-uat:execution-bridge:check
npm run aws:dev-uat:raw-capture-plan:check
npm run aws:dev-uat:raw-input-scaffold:check
npm run aws:dev-uat:operator-input:check
npm run aws:dev-uat:operator-input:fixture:check
npm run aws:dev-uat:operator-runbook:check
npm run aws:dev-uat:operator-runbook:fixture:check
npm run aws:dev-uat:raw-output:fixture:check
npm run aws:dev-uat:raw-input:fixture:check
npm run aws:dev-uat:evidence-bundle:fixture:check
npm run aws:dev-uat:capture-helpers:check
npm run aws:dev-uat:preflight-raw-input:fixture:check
npm run aws:dev-uat:validation-capture:fixture:check
npm run aws:dev-uat:validation-raw-input:fixture:check
npm run aws:dev-uat:materialized-flow:fixture:check
npm run aws:dev-uat:final-readiness:check
npm run aws:dev-uat:final-readiness:fixture:check
npm run aws:dev-uat:operator-handoff:check
npm run aws:dev-uat:operator-handoff:fixture:check
npm run aws:dev-uat:validation:check
npm run aws:dev-uat:validation:fixture:check
npm run aws:dev-uat:evidence:fixture:check
```

この command は `docs/acceptance/evidence/aws_dev_uat_preflight.example.json` を検査する。`fixture` 証跡なので最終検収や AWS dev/UAT 実行完了の根拠にはしない。
`npm run aws:dev-uat:execution-bridge:check` は AWS STS probe を行わず、final evidence path、AWS identity probe command、final gate command order、必要 input、証跡 mapping の整合を検査する。`npm run aws:dev-uat:execution-bridge:probe` は `aws sts get-caller-identity --output json` を read-only で実行し、credentials がなければ `waiting_for_external_execution` として `dist/acceptance/aws_dev_uat_execution_bridge.json` に記録する。
`npm run aws:dev-uat:raw-capture-plan:check` は raw capture plan を生成してから、preflight / validation の command id、`output_ref`、materialize command、raw output/input check command、build command、final command が builder と同期していることを検査する。この command は plan を書き出すだけで、AWS command の実行や外部状態変更は行わない。
`npm run aws:dev-uat:raw-input-scaffold:check` は scaffold を生成してから、preflight / validation の command id、command、`output_ref` が raw capture plan と同期していること、かつ全 command が `pending_capture` のままで final evidence ではないことを検査する。この command は scaffold を書き出すだけで、AWS command の実行や外部状態変更は行わない。
`npm run aws:dev-uat:operator-input:check` は operator input scaffold を生成して、raw capture plan、preflight / validation scaffold、resolved operator input path、materialize command template、final readiness command の同期を検査する。この command は scaffold を書き出すだけで、AWS command の実行や外部状態変更は行わない。
`npm run aws:dev-uat:operator-input:fixture:check` は resolved operator input の positive path と、scaffold の誤用、未解決 placeholder、不正 AWS account id、不正 release URL、未解決 S3 URI の negative path を検査する。fixture は最終検収 evidence として扱わない。
`npm run aws:dev-uat:operator-runbook:check` は operator execution runbook を生成し、未解決 operator input では external execution ready と扱わず、resolved input がある場合だけ外部実行用の command order、confirmation gate、stop condition、evidence output を検査する。この command は runbook を書き出すだけで、AWS command の実行や外部状態変更は行わない。
`npm run aws:dev-uat:operator-runbook:fixture:check` は operator execution runbook の resolved ready path、placeholder 混入、確認なし外部 phase、phase order mismatch の negative path を検査する。fixture は最終検収 evidence として扱わない。
`npm run aws:dev-uat:raw-output:fixture:check` は sample raw input の `output_ref` 参照先を読み、JSON parse と text non-empty の positive path、parse 不能 JSON、空 text、sample/fixture text rejection の negative path を検査する。sample raw output は最終検収 evidence として扱わない。
`npm run aws:dev-uat:raw-input:fixture:check` は sample raw input を dry-run checker に通し、scaffold と `pending_capture` raw input が reject されることを検査する。sample raw input は最終検収 evidence として扱わない。
`npm run aws:dev-uat:evidence-bundle:fixture:check` は sample raw input/output から preflight / validation evidence と bundle manifest を生成し、各 artifact の path、size、sha256 と missing artifact の negative path を検査する。sample bundle manifest は最終検収 evidence として扱わない。
`npm run aws:dev-uat:capture-helpers:check` は helper entrypoint の `--help` と missing-env failure を検査する。実環境 endpoint への HTTP probe は行わない。
`npm run aws:dev-uat:preflight-raw-input:fixture:check` は preflight scaffold と sample raw output files から final raw input を生成し、raw output check、raw input dry-run、preflight final gate へ進めることを検査する。sample raw output は最終検収 evidence として扱わない。
`npm run aws:dev-uat:validation-capture:fixture:check` は E2E、性能、RAG品質結果 capture helper の `--help`、missing-env failure、閾値未達 failure、valid env JSON output を検査する。sample env は最終検収 evidence として扱わない。
`npm run aws:dev-uat:validation-raw-input:fixture:check` は validation scaffold と sample raw output files から final raw input を生成し、raw output check、raw input dry-run、validation final gate へ進めることを検査する。sample raw output は最終検収 evidence として扱わない。
`npm run aws:dev-uat:materialized-flow:fixture:check` は materialized flow fixture として、preflight / validation scaffold から raw input を生成し、raw output/input check、preflight/validation final evidence build、validation suite gate、raw input/output/final evidence/execution bridge を含む evidence bundle manifest まで通す。missing materialized raw input と missing raw output の negative path も検査するが、sample raw output は最終検収 evidence として扱わない。
`npm run aws:dev-uat:final-readiness:check` は final readiness manifest を生成し、raw capture plan、execution bridge、preflight/validation raw input、final evidence、evidence bundle manifest、blockers、next commands を記録する。実 evidence と AWS credentials が揃わない場合は `blocked_by_external_execution` として残し、`--require-ready` では fail する。
final readiness は resolved operator input も必須条件として扱う。`dist/acceptance/aws_dev_uat_operator_input.json` がない場合は `missing_operator_input`、placeholder や不正 URL / 不正 AWS account id が残る場合は `invalid_operator_input` を blocker とし、`npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved` を next command に出す。
final readiness は ready operator execution runbook も必須条件として扱う。`dist/acceptance/aws_dev_uat_operator_execution_runbook.json` がない場合は `missing_operator_runbook`、runbook が `requires_resolved_operator_input` のまま、placeholder を含む、確認なし外部 phase を含む、phase order が崩れている場合は `invalid_operator_runbook` を blocker とし、`npm run aws:dev-uat:operator-runbook:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved` を next command に出す。
`npm run aws:dev-uat:final-readiness:fixture:check` は missing evidence path と ready evidence path を fixture で検査する。sample evidence は最終検収 evidence として扱わない。
`npm run aws:dev-uat:operator-handoff:check` は operator handoff artifact を生成し、external action plan、raw capture plan、final readiness manifest、承認必須 action、critical command order、evidence outputs、blockers、next commands を集約する。この command は release 作成、deploy、migration、publish、E2E、負荷試験、Bedrock Evaluations、signoff を実行しない。
`npm run aws:dev-uat:operator-handoff:fixture:check` は operator handoff の pending / requires_confirmation / AWS not-ready branch を fixture で検査する。sample handoff は最終検収 evidence として扱わない。
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
npm run aws:dev-uat:raw-capture-plan:build
npm run aws:dev-uat:raw-capture-plan:check
npm run aws:dev-uat:raw-input-scaffold:build
npm run aws:dev-uat:raw-input-scaffold:check
npm run aws:dev-uat:operator-input:build
npm run aws:dev-uat:operator-input:check
npm run aws:dev-uat:operator-runbook:build
npm run aws:dev-uat:operator-runbook:check
npm run aws:dev-uat:operator-input:fixture:check
npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:raw-output:fixture:check
npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:raw-input:fixture:check
npm run aws:dev-uat:evidence-bundle:fixture:check
npm run aws:dev-uat:capture-helpers:check
npm run aws:dev-uat:preflight-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json --output <raw-preflight-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url>
npm run aws:dev-uat:preflight-raw-input:fixture:check
npm run aws:dev-uat:validation-capture:fixture:check
npm run aws:dev-uat:materialized-flow:fixture:check
npm run aws:dev-uat:preflight:final
node tools/capture-aws-dev-uat-e2e-result.js --env uat --run-id <run-id> > raw/e2e-allure-run.json
node tools/capture-aws-dev-uat-performance-result.js --env uat --run-id <run-id> > raw/performance-report.json
node tools/capture-aws-dev-uat-rag-quality-result.js --env uat --run-id <run-id> > raw/rag-quality-report.json
npm run aws:dev-uat:validation-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json --output <raw-validation-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url> --aws-account-id <aws-account-id>
npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>
npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>
npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>
npm run test:e2e:aws
npm run perf:aws
npm run rag:quality:aws
npm run aws:dev-uat:validation:check
npm run aws:dev-uat:validation:fixture:check
npm run aws:dev-uat:evidence:fixture:check
npm run aws:dev-uat:materialized-flow:fixture:check
npm run aws:dev-uat:validation:final
npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input <raw-preflight-input.json> --validation-raw-input <raw-validation-input.json> --preflight-evidence dist/acceptance/aws_dev_uat_preflight.json --validation-evidence dist/acceptance/aws_dev_uat_validation.json --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json
npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready
npm run aws:dev-uat:operator-handoff:check
npm run acceptance:external-actions:check
npm run acceptance:final:check
```
