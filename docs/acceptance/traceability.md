# Saphnexa Acceptance Traceability

対象: `.workspace/Saphnexa_検収受入条件_package_v1.0`

状態の意味:

- `local_verified`: この PR のローカル検証で根拠あり。
- `implemented_unverified`: source はあるが、検証は後続。
- `scaffolded`: 設計上の置き場所または契約のみ。
- `requires_aws`: AWS dev/UAT または CI 公開証跡が必要。
- `not_started`: 未実装。

| ID | 状態 | 根拠または制約 |
| :--- | :--- | :--- |
| AC-001 | requires_aws | `npm run acceptance:package:build` で `dist/acceptance/evidence_manifest.draft.json` を生成し、`npm run acceptance:external-actions:build` / `npm run acceptance:external-actions:check` で Git tag/release/final manifest action を pending 追跡する。`npm run acceptance:final-candidate:check` / `npm run acceptance:final:check` で Git tag/release/最終 evidence manifest 未確定を検査するが、Git tag/release と最終 evidence manifest は未作成。 |
| AC-002 | requires_aws | `npm run acceptance:package:build` で `dist/acceptance/artifact_summary.draft.json` と CloudFormation inventory draft を生成し、`npm run acceptance:package:check` で source/CDK/CloudFormation/DB migration/Allure/Docusaurus/runbook/release/checklist の提出物状態を検査する。`npm run acceptance:external-actions:build` / `npm run acceptance:external-actions:check` で AWS deploy/publish/CloudFormation capture action を pending 追跡し、`npm run acceptance:final-candidate:check` で final artifact URL 候補の未配置を検査するが、CDK/CloudFormation/Allure/Docusaurus publish は未実施。 |
| AC-003 | local_verified | `docs/adr/ADR-0001-local-first-acceptance-slice.md` に設計差分を記録し、`npm run docs:check` で docs 構造を検査。 |
| AC-004 | requires_aws | `dist/acceptance/acceptance_checklist.draft.csv` は全行を `PASS_LOCAL` / `PENDING_AWS` で記入し、`npm run acceptance:external-actions:build` / `npm run acceptance:external-actions:check` で final checklist signoff action を pending 追跡する。`npm run acceptance:final-candidate:check` で final checklist 候補の未配置、`npm run acceptance:final:check` で `PENDING_AWS` 残件を検査するが、最終検収 checklist の署名・AWS 証跡確認は未実施。 |
| AC-010 | local_verified | `apps/api/src/local-api.js` と `tests/integration-local.test.js` で質問受付、`message_id`、`run_id` を検証。 |
| AC-011 | local_verified | `packages/rag-core/src/fixture-rag.js` と local tests で citation 生成を検証。 |
| AC-012 | local_verified | fixture RAG の根拠なし拒否を `tests/integration-local.test.js` で検証。 |
| AC-013 | local_verified | chat creation creates `chat_sessions` and owner `chat_participants` in local integration. |
| AC-014 | local_verified | owner share and viewer write denial in local integration. |
| AC-015 | local_verified | `favorites` store/API source と `tests/e2e-local.test.js` で登録/一覧を検証。 |
| AC-016 | local_verified | `npm run admin:workflow:check` で user import の create/update/delete/invalid row、結果 prefix、error rows report を検査。実 S3 report は未実施。 |
| AC-017 | local_verified | `npm run admin:workflow:check` で document registration 5件、raw URI、parsed prefix、metadata JSON、ingestion job を検査。AWS/S3 inventory は未検証。 |
| AC-018 | local_verified | `npm run admin:workflow:check` で document version activation の新 active/旧 archived を検査。 |
| AC-019 | local_verified | `npm run admin:workflow:check` で evaluation run 3件、retrieval/generation/end-to-end metrics、artifact prefix を検査。AWS 評価 report は未実施。 |
| AC-020 | local_verified | `npm run artifacts:check` で local API の admin artifact 一覧/アクセス cookie が admin のみ許可、一般/未認証は拒否されることを検査。CloudFront Cookie 実公開は未実施。 |
| AC-021 | local_verified | `dist/admin/test-reports/allure/latest/` と local API admin artifact policy を `npm run artifacts:check` で検査。Allure/CloudFront 実公開は未実施。 |
| AC-030 | local_verified | `packages/api-contract/src/routes.js` 38 routes and `tools/check-contracts.js`. |
| AC-031 | local_verified | `packages/tool-contract/src/tools.js` 6 tools and audit table metadata. |
| AC-032 | local_verified | `errorResponseSchema` and local API error response shape. |
| AC-033 | local_verified | state-changing route metadata has `csrfRequired`; `apps/api/src/local-api.js` の runtime guard と `tests/integration-local.test.js` で token 欠落/不一致 403 を検証。 |
| AC-034 | local_verified | `tools/scan-bundle-domains.js` scans web/API client source. |
| AC-035 | local_verified | `infra/constructs/edge-static` の CloudFront Function routing intent と `npm run edge:security:check` で viewer/internal path metadata を検査。実 CloudFront Function は未実装。 |
| AC-036 | local_verified | `apps/web/src/routes.ts` と `npm run edge:security:check` で `/` rewrite、`/chat`、`/admin`、admin artifact path の single-entry route intent を検査。 |
| AC-040 | local_verified | local API returns 401/403 for missing/unauthorized actor paths in tests. |
| AC-041 | local_verified | admin APIs reject general user in local integration. |
| AC-042 | local_verified | non-participant chat event/detail access is rejected. |
| AC-043 | local_verified | fixture RAG records ACL denied count before Evidence. |
| AC-044 | local_verified | `infra/constructs/realtime` の channel policy intent と local ws-ticket の TTL/single-use/user scope を `npm run edge:security:check` で検査。実 AppSync Events は未実施。 |
| AC-045 | local_verified | local ws-ticket の期限切れ/再利用/他ユーザー利用拒否を `tests/integration-local.test.js` で検証。実 AppSync Events は未実施。 |
| AC-046 | local_verified | `npm run security:scan` と `npm run scan:bundle-domains` で source の secret/domain token を検査。CloudWatch/S3 sampling は未実施。 |
| AC-047 | local_verified | `infra/aspects/security-baseline.js` と EdgeStaticConstruct の `wafAttached` intent を `npm run edge:security:check` で検査。実 WAF ACL は未確認。 |
| AC-048 | local_verified | ObservabilityCicdConstruct の IAM wildcard review / cdk-nag / permissions boundary intent と baseline を `npm run edge:security:check` で検査。IAM policy 実体と cdk-nag 実行は未実施。 |
| AC-050 | local_verified | `npm run web:flow:check` で `/chat`、`/admin`、admin docs/report paths の role route と local access flow を検査。実ブラウザ/CloudFront ロール別 E2E は未実施。 |
| AC-051 | local_verified | `apps/web/src/*` が `packages/ui` を経由し、直書き `style` が 0 件であることを `npm run ui:check` で検査。 |
| AC-052 | local_verified | `npm run web:flow:check` で chat UI の質問入力、送信、event 表示、empty/disabled state と local API flow を検査。実ブラウザ E2E は未実施。 |
| AC-053 | local_verified | `npm run web:flow:check` で admin UI の評価実行、成果物一覧、admin 限定 artifact access と local API flow を検査。実ブラウザ E2E は未実施。 |
| AC-054 | local_verified | `npm run ui:check` と `npm run web:a11y:check` で main/nav/section labels、form label、button type、link text、status label の静的 a11y report violations 0 を検査。axe/Playwright report は未実施。 |
| AC-055 | local_verified | `npm run web:perf:local` と `npm run web:bundle:check` で web source gzip <= 500KB、route transition fixture p95 <= 500ms、bundle report を検査。Lighthouse CI/production bundle analyzer は未実施。 |
| AC-060 | local_verified | local integration checks event ordering and names subset. |
| AC-061 | local_verified | `assertNotificationIsLightweight` rejects answer/chunk fields. |
| AC-062 | local_verified | event notification points to REST detail and auth is rechecked. |
| AC-063 | local_verified | `npm run admin:workflow:check` で user_import/ingestion/evaluation/artifact の admin event を検査。実 publisher integration は未実装。 |
| AC-064 | local_verified | `after_seq` local event API と viewer REST detail 取得を `tests/e2e-local.test.js` で検証。実 WebSocket disconnect は未実施。 |
| AC-070 | local_verified | `npm run db:migration:check` で Flyway versioned SQL、schema_migrations、checksum算出、required tables を静的検査。Aurora DSQL/Flyway 実適用は未実施。 |
| AC-071 | local_verified | `npm run db:migration:check` で migration が手書き SQL で、ORM auto migration command/marker がないことを検査。 |
| AC-072 | local_verified | `npm run db:integrity:check` で local DB-like store の tenant/user/chat/participant/message/run/document/version/ingestion/evaluation/artifact invariant violation 0件を検査。DSQL query report は未実施。 |
| AC-073 | local_verified | owner/viewer DB-like store relation and denial tested. |
| AC-074 | local_verified | `npm run db:integrity:check` で local event_seq 重複0件、payload/status 更新なしを検査。DB trigger/audit query は未実施。 |
| AC-075 | local_verified | `npm run search:local:check` で reference graph sample 10件中10件展開成功を検査。実 DSQL reference_nodes/reference_edges query は未実施。 |
| AC-076 | local_verified | `npm run search:local:check` で BM25F golden recall@10 = 1.00 を検査。実 DSQL BM25F posting/stats 生成は未実施。 |
| AC-077 | local_verified | model catalog shared by API/store. |
| AC-080 | local_verified | 7 construct inventory exists and is tested. |
| AC-081 | requires_aws | `npm run cfn:inventory:build` / `npm run cfn:inventory:check` で local CDK intent 由来の inventory draft と最終 capture 手順を検査し、`npm run acceptance:external-actions:build` / `npm run acceptance:external-actions:check` で CloudFormation capture action を pending 追跡するが、検収環境の CloudFormation `describe-stacks` / `list-stack-resources` は未実施。 |
| AC-082 | local_verified | DataConstruct の KMS rotation / SSE-KMS / service principal / public access deny intent を `npm run edge:security:check` で検査。実 KMS policy は未確認。 |
| AC-083 | local_verified | `infra/aspects/security-baseline.js` の S3/WAF/IAM/cdk-nag/SQS/log retention baseline を `npm run edge:security:check` と `npm run security:scan` で検査。実 AWS Security Hub 等は未実施。 |
| AC-084 | local_verified | local raw/parsed prefix と OpenSearch 非依存を `npm run storage:check` で検査。S3 inventory は未実施。 |
| AC-085 | local_verified | EdgeStaticConstruct と `apps/web/src/routes.ts` の single-entry route/path intent を `npm run edge:security:check` で検査。実 CloudFront deploy は未実施。 |
| AC-086 | local_verified | RagProcessingConstruct の queues/DLQs/maxReceiveCount/visibilityTimeout intent を `npm run edge:security:check` で検査。実 SQS/DLQ は未確認。 |
| AC-087 | local_verified | `npm run admin-artifacts:build` で `dist/admin/docs/latest/` と `dist/admin/docs/versions/v0.16/` を生成し、runbooks/ADR/trace を manifest に含める。Docusaurus/CloudFront/S3 publish は未実施。 |
| AC-088 | local_verified | `npm run admin-artifacts:build` で `dist/admin/test-reports/allure/latest/` の Allure 互換 local report を生成し、`npm run artifacts:check` で manifest/source/checksum を検査。Allure CLI/CloudFront/S3 publish は未実施。 |
| AC-090 | local_verified | `npm run rag:quality:check` で fixture RAG Agent IF が question/actor/retrieval_policy/run context を受け final/refusal output と tool invocation を返すことを検査。実 AgentCore Runtime logs は未実施。 |
| AC-091 | local_verified | `assertRetrievalPolicyNotRelaxed` test あり。 |
| AC-092 | local_verified | fixture RAG calls Tools functions and records `tool_invocations`. |
| AC-093 | local_verified | `kbRetrieve` requires retrieval policy and returns results. |
| AC-094 | local_verified | ACL check is called before evidence packing. |
| AC-095 | local_verified | `npm run rag:quality:check` で reference expansion golden 10件中10件成功を検査。実 reference_edges/KB 評価は未実施。 |
| AC-096 | local_verified | citation format and event detail tested locally. |
| AC-097 | local_verified | evaluation metrics categories in local source and `tests/e2e-local.test.js` local path. AWS 評価 report は未実施。 |
| AC-098 | local_verified | `npm run rag:quality:check` で `dist/reports/rag-quality-local.json` を生成し、recall@10/citation precision/groundedness/refusal accuracy/unsupported claim rate の local thresholds を検査。Bedrock Evaluations/実KB report は未実施。 |
| AC-099 | local_verified | `npm run rag:security:check` で prompt injection attack 20件中 policy violation 0件、tool invocation 0件を検査。実 AgentCore trace は未実施。 |
| AC-100 | local_verified | `npm run offline-artifacts:check` で raw/parsed/chunk/reference/BM25F/parser artifact inventory を生成・検査。PDF/KB/S3 Vectors 実行は未実施。 |
| AC-101 | local_verified | document metadata 必須 field と raw prefix を `tests/integration-local.test.js` / `npm run storage:check` で検査。Retrieve metadata 実体は未実施。 |
| AC-102 | local_verified | `npm run storage:check` で parsed prefix、`npm run offline-artifacts:check` で chunk/reference/BM25F/parser artifact inventory を検査。実 S3 inventory は未実施。 |
| AC-103 | local_verified | 同一 document_id/version_id の再登録で document_version が重複しないことを `tests/integration-local.test.js` で検証。 |
| AC-104 | local_verified | metadata 不備で failed job、admin event、retry 可能状態になることを `tests/integration-local.test.js` で検証。KB失敗注入は未実施。 |
| AC-110 | local_verified | `packages/domain/src/observability.js` と `tests/e2e-local.test.js` で共通 JSON log schema を検査。CloudWatch sampling は未実施。 |
| AC-111 | local_verified | `assertTracePropagation` で local API/worker/tools/agent chain の trace_id/correlation_id 伝播を検査。実 AWS trace は未実施。 |
| AC-112 | local_verified | `npm run observability:check` で API latency、5xx、RAG latency、retrieval count、DLQ count、ingestion failed、evaluation failed の required metrics 7/7 を catalog と local sample で検査。CloudWatch metrics は未実施。 |
| AC-113 | local_verified | `npm run observability:check` で 5xx、DLQ、RAG失敗率、ingestion失敗、評価失敗、WAF block急増の required alarms 6/6 を catalog 検査。CloudWatch alarms は未実施。 |
| AC-114 | local_verified | `audit_events` table/store と `npm run admin:workflow:check` で admin 操作、文書公開/成果物、チャット共有、Tools execution、評価の audit category を検査。 |
| AC-120 | local_verified | `.github/workflows/ci.yml` に 14 jobs を追加し `npm run ci:check` で workflow shape を検査。PR #1 の GitHub Actions `Saphnexa CI` で lint/typecheck/unit/integration/e2e/cdk synth/cdk diff/security scan/license scan/admin artifacts/quality gates/db observability/admin offline restore/contract generation diff が pass。 |
| AC-121 | local_verified | `npm run coverage:check` で Node test coverage line >=80% / branch >=70% と test pass 100% を検査。Allure unit artifact への publish は未実施。 |
| AC-122 | local_verified | `npm run test:integration:local` と `npm run verify` で local API/store/RAG/tools/admin artifact/edge intent の統合 smoke を検査。AWS/DSQL/S3/AppSync/Tools 実結合は未実施。 |
| AC-123 | local_verified | `tests/e2e-local.test.js` と `npm run web:flow:check` を CI 対象化し、local API/source gate の E2E smoke を検査。ブラウザ/CloudFront E2E は未実施。 |
| AC-124 | local_verified | 基本設計 5.6.3 の 15 pairwise ケースを `packages/testing/src/pairwise.js` に catalog 化し、`npm run pairwise:check` で実行率/要因 coverage を検査。 |
| AC-125 | local_verified | `npm run test:contract`, `npm run acceptance:check`, `npm run evidence:check` を contract-generation-diff job に追加。生成物 diff の本格化は後続。 |
| AC-126 | local_verified | CI workflow に `admin-artifacts` job を追加し、`npm run admin-artifacts:build` / `npm run artifacts:check` を検査対象化。PR #1 の GitHub Actions 14 jobs は pass。Allure publish URL は未実施。 |
| AC-130 | local_verified | `npm run perf:api:local` で認証済み local non-AI API p95 <= 800ms、error rate < 1% を検査。AWS load test/CloudWatch metrics は未実施。 |
| AC-131 | local_verified | `npm run perf:local` で local 質問受付 p95 <= 2s を検査。AWS load test は未実施。 |
| AC-132 | local_verified | `npm run rag:perf:local` で local RAG 初回通知 p95 <= 5s を検査。AppSync logs/E2E timing は未実施。 |
| AC-133 | local_verified | `npm run rag:perf:local` で local RAG final answer p95 <= 60s、timeout rate < 2% を検査。AWS RAG load test は未実施。 |
| AC-134 | local_verified | lightweight notification size guard. |
| AC-135 | local_verified | `npm run failure:check` で retrieval / generation / worker notify の 3 failure injection が failed 状態、`chat.run.failed` event、retryable=true を残すことを検査。実 AgentCore/Lambda failure injection は未実施。 |
| AC-140 | local_verified | `packages/model-catalog/src/cost-estimate.js` と `npm run cost:check` で 50 DAU/10質問日の local estimate <= 550 USD を検査。AWS Cost Explorer は未実施。 |
| AC-141 | local_verified | `npm run storage:check` で code/infra/package に OpenSearch dependency がないことを検査。AWS inventory は未実施。 |
| AC-142 | local_verified | `npm run observability:check` で CloudWatch/S3/DSQL 相当 retention catalog の retention_days 未設定0件を検査。実リソース確認は未実施。 |
| AC-143 | local_verified | runbooks を `docs/ops/runbooks/` に追加し `npm run docs:check` で構造検査、`npm run admin-artifacts:build` で docs artifact に含める。Docusaurus 公開は未実施。 |
| AC-144 | local_verified | `docs/ops/runbooks/backup-restore.md` と `npm run restore:drill:check` で local snapshot restore drill、RTO/RPO、checksum を検査。AWS backup/restore 実試験は未実施。 |
| AC-150 | requires_aws | `npm run acceptance:external-actions:build` / `npm run acceptance:external-actions:check` で release/AWS/final checklist action を pending 追跡し、`npm run acceptance:final:check` で P0 未達が残る限り `P0_all_pass=false` を検査。最終 P0 全 PASS は未達。 |
| AC-151 | requires_aws | `npm run acceptance:external-actions:build` / `npm run acceptance:external-actions:check` で release/AWS/final checklist action を pending 追跡し、`npm run acceptance:final:check` で P0/P1 未達が残る限り final ready にならないことを検査。最終 P1 全 PASS は未達。 |
| AC-152 | requires_aws | `npm run acceptance:external-actions:build` / `npm run acceptance:external-actions:check` で release/AWS/final checklist action を pending 追跡し、`npm run acceptance:final:check` で aggregate gate を検査するが、P0/P1 残件があるため初回検収完了条件として未達。 |
| AC-153 | local_verified | `gh issue list --state open --json number,title,labels,state` の snapshot を `docs/acceptance/defects/open_issues_snapshot.json` に保存し、`npm run acceptance:package:check` で Blocker/Critical open defect 0 件を検査。最終検収時は再取得が必要。 |
