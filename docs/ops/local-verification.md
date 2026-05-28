# Local Verification

## 目的

`.workspace/local.md` の方針に合わせ、ローカルでは契約、認可、非同期 event、RAG Tools 境界、UI の相対 path 方針を検証する。

## コマンド

```bash
npm run test:contract
npm run api:openapi:check
npm run test:integration:local
npm run scan:bundle-domains
npm run cdk:constructs:check
npm run cfn:inventory:build
npm run cfn:inventory:check
npm run edge:identity:realtime:check
npm run cfn:inventory:normalize:fixture:check
npm run admin-artifacts:build
npm run artifacts:check
npm run admin-artifacts:publish:check
npm run coverage:check
npm run ui:check
npm run web:flow:check
npm run web:a11y:check
npm run web:perf:local
npm run web:bundle:check
npm run perf:api:local
npm run failure:check
npm run rag:quality:check
npm run rag:security:check
npm run rag:aws-binding:check
npm run rag:perf:local
npm run db:migration:check
npm run db:integrity:check
npm run search:local:check
npm run observability:check
npm run edge:security:check
npm run admin:workflow:check
npm run offline-artifacts:check
npm run restore:drill:check
npm run acceptance:source:check
npm run acceptance:external-actions:build
npm run acceptance:external-actions:check
npm run acceptance:final-checklist:fixture:check
npm run acceptance:final-manifest:fixture:check
npm run acceptance:final-candidate:fixture:check
npm run acceptance:final:fixture:check
npm run acceptance:final-candidate:check
npm run acceptance:final:build
npm run acceptance:final:check
npm run acceptance:package:build
npm run acceptance:package:check
npm run aws:dev-uat:preflight
npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>
npm run aws:dev-uat:execution-bridge:check
npm run aws:dev-uat:execution-bridge:probe
npm run aws:dev-uat:raw-capture-plan:build
npm run aws:dev-uat:raw-capture-plan:check
npm run aws:dev-uat:raw-input-scaffold:build
npm run aws:dev-uat:raw-input-scaffold:check
npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>
npm run aws:dev-uat:raw-output:fixture:check
npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>
npm run aws:dev-uat:raw-input:fixture:check
npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input <raw-preflight-input.json> --validation-raw-input <raw-validation-input.json> --preflight-evidence dist/acceptance/aws_dev_uat_preflight.json --validation-evidence dist/acceptance/aws_dev_uat_validation.json --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json
npm run aws:dev-uat:evidence-bundle:fixture:check
npm run aws:dev-uat:capture-helpers:check
npm run aws:dev-uat:validation-capture:fixture:check
npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>
npm run aws:dev-uat:validation:check
npm run aws:dev-uat:validation:fixture:check
npm run aws:dev-uat:evidence:fixture:check
npm test
git diff --check
```

## ローカルで確認できること

- 公開 API 38 件と Tools API 6 件の contract metadata。
- Hono/Zod/OpenAPI 実装 entrypoint が 38 route と `/openapi.json` を route contract から生成し、CSRF/role/Zod validation metadata を保持すること。
- CDK 実 Construct source が 7 Construct class を持ち、DSQL、CloudFront、Cognito、AppSync Events、S3 Vectors、Bedrock KB、AgentCore、admin artifacts 公開基盤の CloudFormation resource type inventory と同期していること。
- CloudFront / Cognito / AppSync Events binding source が、SPA/API/AppSync/admin artifacts origin、`/api/*` と `/auth/*` の versioned API rewrite、Cognito OAuth code flow、AppSync Events `chat` / `admin` namespace、admin artifacts signed cookie KeyGroup と同期していること。
- chat が独立リソースであり、owner/viewer によって操作権限が変わること。
- 質問送信が `message_id` / `run_id` を即時生成し、event detail を REST で取得できること。
- RAG が Tools API 境界を通り、ACL check 後の Evidence だけで citation を作ること。
- React source が `/api/*` と `/auth/*` の相対 path だけを使うこと。
- `dist/acceptance/cloudformation_inventory.draft.json` に CloudFormation inventory draft を生成し、実 AWS capture が必要なことを検査すること。
- AWS CLI の `describe-stacks` / `list-stack-resources` raw JSON から final CloudFormation inventory 形式へ正規化する normalizer の fixture。
- `dist/admin/docs/latest/`、`dist/admin/docs/versions/v0.16/`、`dist/admin/docs/versions/v0.17/` に Docusaurus source と対応する docs artifact を生成できること。
- `dist/admin/test-reports/allure/latest/` と `dist/admin/test-reports/allure/runs/local-latest/` に Allure 互換のローカル検証 report artifact を生成できること。
- `npm run admin-artifacts:publish:check` で Docusaurus package/config、Allure latest/run/raw results prefix、CloudFront signed cookie 対象 path、S3 sync 候補が同期していること。
- admin artifact manifest の checksum、viewer path、source と、local API の admin 限定アクセス policy。
- Node test coverage が line 80% / branch 70% の threshold を満たすこと。
- UI source が共通 UI package を経由し、直書き style と基本 a11y 欠落を増やしていないこと。
- chat/admin の local web flow、route role、admin artifact access policy が API/source gate として整合すること。
- static a11y report が main/nav/section labels、form label、button type、link text、status label を violations 0 で検査すること。
- local web bundle report が gzip size と route transition p95 を検査し、`dist/reports/web-bundle-local.json` を生成すること。
- local non-AI API smoke が p95 800ms / error rate 1% 未満を満たすこと。
- retrieval、generation、worker notify の failure injection で failed 状態、error event、retryable が残ること。
- local RAG golden dataset で品質 metrics と参照展開が基準を満たすこと。
- prompt injection attack 20件で policy violation と tool invocation が発生しないこと。
- Bedrock KB / S3 Vectors / AgentCore Runtime / AgentCore Gateway Target が Tools API、ACL precheck、S3 Vectors metadata、DSQL endpoint と source-level で接続されていること。
- local RAG timing smoke で初回通知と最終回答の p95 が基準を満たすこと。
- Flyway versioned SQL migration の命名、schema_migrations、required tables、checksum、自動 migration 不採用。
- local DB-like store の主要ドメイン整合性と chat event append-only invariant。
- 参照グラフ sample 10/10 と BM25F golden recall@10 >= 0.80。
- required metrics 7/7、alarms 6/6、retention 未設定 0件の catalog。
- CloudFront Function、single-entry route、ws-ticket、WAF/IAM/KMS/SQS/DLQ/cdk-nag の static intent catalog。
- user import の create/update/delete/invalid row、文書登録 5 件、版 activation、評価 run 3 件、admin event、audit event のローカル workflow。
- chunk/reference/BM25F/parser を含む offline artifact inventory のローカル manifest。
- in-memory domain state の restore drill report、RTO/RPO threshold、snapshot/restored checksum。
- `docs/acceptance/source/acceptance_catalog.json` が検収 checklist v1.0 の 102 行、P0/P1/P2 件数、traceability 全 ID と同期していること。
- `npm run acceptance:external-actions:check` が `dist/acceptance/external_action_plan.json` を再生成してから検査し、Git tag/release、AWS deploy/publish、AWS dev/UAT validation、CloudFormation capture、defect-snapshot-refresh、final checklist signoff の各 action が pending かつ確認必須のまま残ること。
- final acceptance checklist builder が source catalog の列、ID 順、全 AC 行を保って `結果=PASS` の CSV を生成する fixture。
- final evidence manifest builder が current Git commit、package version、CloudFormation inventory、Git release/artifact input を組み合わせて final candidate ready path を検査する fixture。
- final evidence candidate が未配置なら `not_ready` として記録し、配置済みの場合は実 Git tag/release/AWS/公開 URL/checklist を検査すること。
- `npm run acceptance:final:fixture:check` が final candidate ready 後の positive path を検査し、readiness aggregate gate が complete に遷移できること。
- `npm run acceptance:final:check` が `dist/acceptance/final_readiness.json` を再生成してから検査し、release/AWS/publish/checklist 未達がある限り ready にならないこと。
- `dist/acceptance/` に検収 package draft を生成し、未実施 AWS/release 項目を `PENDING_AWS` として残すこと。
- `npm run aws:dev-uat:preflight` が AWS dev/UAT 証跡の fixture 構造を検査し、実証跡では `npm run aws:dev-uat:preflight:final` が必要であること。
- `npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>` が実 AWS raw capture input から `dist/acceptance/aws_dev_uat_preflight.json` を生成すること。
- `npm run aws:dev-uat:execution-bridge:check` が `dist/acceptance/aws_dev_uat_execution_bridge.json` を生成し、final evidence path、AWS identity probe command、final gate command order、必要 input、証跡 mapping を検査すること。
- `npm run aws:dev-uat:execution-bridge:probe` が AWS STS の read-only probe と final evidence file の有無を記録し、credentials や `aws-captured` 証跡が足りない場合は `waiting_for_external_execution` として残すこと。
- `npm run aws:dev-uat:raw-capture-plan:check` が `dist/acceptance/aws_dev_uat_raw_capture_plan.json` を生成し、preflight / validation の command id、`output_ref`、build command、final command が builder と同期していることを検査すること。
- `npm run aws:dev-uat:raw-input-scaffold:check` が `dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json` と `dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json` を生成し、raw capture plan の command id、command、`output_ref` と同期していること、かつ `pending_capture` の未捕捉 draft として final evidence ではないことを検査すること。
- `npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>` と `npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>` が raw input の `output_ref` 参照先を読み、JSON output の parse と text output の non-empty を検査すること。
- `npm run aws:dev-uat:raw-output:fixture:check` が sample raw output の positive path と、parse 不能 JSON、空 text、sample/fixture text rejection を検査すること。
- `npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>` と `npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>` が operator 入力を一時ディレクトリで evidence build し、既存 final gate 相当を通すこと。
- `npm run aws:dev-uat:raw-input:fixture:check` が sample raw input の dry-run positive path と、scaffold / `pending_capture` rejection を検査すること。
- `npm run aws:dev-uat:evidence-bundle:check -- ...` が preflight / validation の raw input、raw output、final evidence、execution bridge を束ね、各 artifact の path、size、sha256 を `dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json` に記録すること。
- `npm run aws:dev-uat:evidence-bundle:fixture:check` が sample bundle manifest の positive path と missing artifact の negative path を検査すること。
- `npm run aws:dev-uat:capture-helpers:check` が raw capture plan に listed された repo-local helper entrypoint の help と missing-env failure を検査すること。
- `npm run aws:dev-uat:validation-capture:fixture:check` が validation raw output capture helper の help、missing-env failure、閾値未達 failure、valid env JSON output を検査すること。
- `npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>` が実 AWS E2E・性能・RAG品質 raw result から `dist/acceptance/aws_dev_uat_validation.json` を生成すること。
- `npm run aws:dev-uat:validation:check` が E2E・性能・RAG品質結果の fixture 構造と閾値を検査し、`npm run aws:dev-uat:validation:fixture:check` が fixture/negative path を検査し、実証跡では `npm run test:e2e:aws`、`npm run perf:aws`、`npm run rag:quality:aws`、`npm run aws:dev-uat:validation:final` が必要であること。
- `npm run aws:dev-uat:evidence:fixture:check` が sample raw input を一時ディレクトリへ変換し、既存 final checker で builder output を検査すること。raw input の `capture_provenance` 欠落時と `output_ref` 参照先欠落時に builder が fail することも検査する。
- GitHub issue tracker snapshot に基づく Blocker/Critical open defect 0 件の defect list draft。最終検収では `gh issue list --state open --json number,title,labels,state` による defect-snapshot-refresh が必要であり、ローカル snapshot だけでは完了扱いにしないこと。

## ローカルでは完了扱いにしないこと

- AWS dev/UAT での Cognito、DSQL、S3、CloudFront、AppSync Events、Bedrock KB、S3 Vectors、AgentCore の実接続。
- Hono runtime の実 Lambda adapter 起動、依存 install、Cognito authorizer、CSRF cookie integration、CloudFront 経由の実 HTTP request。
- `aws-cdk-lib` / `constructs` install 後の実 `cdk synth`、CDK bootstrap、CDK deploy、CloudFormation change set 実行。
- CDK deploy、CloudFormation outputs、S3 inventory、CloudWatch logs、CloudFront/S3/Docusaurus/Allure 公開 URL。
- `aws s3 sync dist/admin/docs/versions/v0.17/ ...` と Allure run別 publish の実行結果。
- CloudFormation `describe-stacks` / `list-stack-resources` の実取得と、AC-081 の最終 PASS 判定。
- GitHub issue tracker の最終再取得と、AC-153 の最終 PASS 判定。
- axe/Playwright の実 DOM accessibility report、Lighthouse CI、本番 bundler の analyzer report、AWS load test。
- 実ブラウザ操作による chat/admin E2E、CloudFront 経由のロール別導線確認。
- Bedrock KB、S3 Vectors、AgentCore Runtime、Bedrock Evaluations を使った実 RAG 品質評価。
- Aurora DSQL への Flyway 実適用、CloudWatch metrics/alarms、S3 lifecycle、DSQL retention settings の実リソース確認。
- CloudFront Function、WAF、IAM policy、KMS key policy、SQS/DLQ、AppSync Events、cdk-nag の実リソース/実行結果確認。
- 実 S3 の offline artifact inventory、実 parser/KB/S3 Vectors ingestion、実バックアップからの restore drill。
- `npm run aws:dev-uat:preflight` は fixture の構造確認だけを行う。実 AWS dev/UAT 証跡は `dist/acceptance/aws_dev_uat_preflight.json` を `evidence_class: aws-captured` で作成し、`npm run aws:dev-uat:preflight:final` を通す必要がある。
- `npm run aws:dev-uat:evidence:fixture:check` は builder の構造確認だけを行う。sample raw input は最終検収や AWS dev/UAT 実行完了の根拠にしない。
- raw input の `capture_provenance` は、取得コマンドと raw output ref の監査用 metadata である。`output_ref` は raw input ファイルからの相対パスで、参照先ファイルが存在する必要がある。実 AWS credentials と raw output 本体がなければ、最終検収 evidence として扱わない。
- `npm run aws:dev-uat:execution-bridge:probe` は AWS credentials と final evidence file の有無を記録するだけであり、deploy、migration、publish、load test、Bedrock Evaluations は実行しない。
- `npm run aws:dev-uat:raw-capture-plan:check` は raw capture plan の生成と構造検査だけを行う。plan に listed された command の実行や raw output の取得は行わない。
- `npm run aws:dev-uat:raw-input-scaffold:check` は raw input scaffold の生成と構造検査だけを行う。`pending_capture` の scaffold は final raw input ではなく、実 AWS raw output、`captured_at`、`capture_provenance.commands[].status: captured`、参照先 `output_ref` が揃うまで最終検収 evidence として扱わない。
- `npm run aws:dev-uat:raw-output:fixture:check` は sample raw output の形式確認だけを行う。実 AWS credentials、実 raw output、実 deploy/publish がなければ最終検収 evidence として扱わない。
- `npm run aws:dev-uat:raw-input:fixture:check` は sample raw input の dry-run 構造確認だけを行う。実 AWS credentials、実 raw output、実 deploy/publish がなければ最終検収 evidence として扱わない。
- `npm run aws:dev-uat:evidence-bundle:fixture:check` は sample bundle manifest の構造確認だけを行う。実 AWS credentials、実 raw output、final evidence、execution bridge が揃わなければ最終検収 evidence として扱わない。
- `npm run aws:dev-uat:capture-helpers:check` は helper の `--help` と missing-env failure だけを確認する。実環境 URL への HTTP probe は、必須 env を指定して helper を明示実行した場合だけ行う。
- `npm run aws:dev-uat:validation-capture:fixture:check` は helper の構造確認だけを行う。実 E2E 実行、負荷試験、Bedrock Evaluations job 実行、CloudFront log 取得は行わない。
- `npm run aws:dev-uat:validation:check` は fixture の構造確認だけを行う。実 AWS dev/UAT E2E・性能・RAG品質証跡は `dist/acceptance/aws_dev_uat_validation.json` を `evidence_class: aws-captured` で作成し、final suite gate を通す必要がある。
- Git tag、GitHub release、検収用 `evidence_manifest.json` の最終確定。
- 外部 action plan に記載された release、deploy、publish、AWS dev/UAT validation、CloudFormation capture、defect snapshot refresh、final evidence 作成、signoff の実行。
- 検収 checklist の最終署名、AWS account id、CloudFormation stack id、公開済み docs/Allure URL の確定。
- P0/P1/P2 全行の最終 PASS 判定。
