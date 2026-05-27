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
| AC-001 | requires_aws | Git tag/release/evidence manifest は未作成。 |
| AC-002 | requires_aws | CDK/CloudFormation/Allure/Docusaurus publish は未実施。 |
| AC-003 | implemented_unverified | `docs/adr/ADR-0001-local-first-acceptance-slice.md` に設計差分を記録。 |
| AC-004 | requires_aws | 検収 CSV の全行記入は最終検収時。 |
| AC-010 | implemented_unverified | `apps/api/src/local-api.js` と `tests/integration-local.test.js` で質問受付を検証予定。 |
| AC-011 | implemented_unverified | `packages/rag-core/src/fixture-rag.js` が citation を生成。 |
| AC-012 | implemented_unverified | fixture RAG が根拠なし質問を拒否。 |
| AC-013 | local_verified | chat creation creates `chat_sessions` and owner `chat_participants` in local integration. |
| AC-014 | local_verified | owner share and viewer write denial in local integration. |
| AC-015 | implemented_unverified | `favorites` store/API source あり。 |
| AC-016 | implemented_unverified | user import job/rows source あり。 |
| AC-017 | implemented_unverified | document registration creates ingestion job and raw URI source. |
| AC-018 | implemented_unverified | document version activation source あり。 |
| AC-019 | implemented_unverified | evaluation run source あり。 |
| AC-020 | requires_aws | Docusaurus CloudFront access control は未実施。 |
| AC-021 | requires_aws | Allure CloudFront access control は未実施。 |
| AC-030 | local_verified | `packages/api-contract/src/routes.js` 38 routes and `tools/check-contracts.js`. |
| AC-031 | local_verified | `packages/tool-contract/src/tools.js` 6 tools and audit table metadata. |
| AC-032 | local_verified | `errorResponseSchema` and local API error response shape. |
| AC-033 | implemented_unverified | state-changing route metadata has `csrfRequired`; runtime middleware 未実装。 |
| AC-034 | local_verified | `tools/scan-bundle-domains.js` scans web/API client source. |
| AC-035 | scaffolded | viewer/internal path metadata exists; CloudFront Function 未実装。 |
| AC-036 | scaffolded | `apps/web/src/routes.ts` に主要 path を定義。 |
| AC-040 | local_verified | local API returns 401/403 for missing/unauthorized actor paths in tests. |
| AC-041 | local_verified | admin APIs reject general user in local integration. |
| AC-042 | local_verified | non-participant chat event/detail access is rejected. |
| AC-043 | local_verified | fixture RAG records ACL denied count before Evidence. |
| AC-044 | scaffolded | ws-ticket channel scope source あり、実 WebSocket 未実装。 |
| AC-045 | scaffolded | ws-ticket source あり、期限切れ/再利用 test 未実装。 |
| AC-046 | implemented_unverified | bundle domain scan あり、secret scan 未実施。 |
| AC-047 | scaffolded | `infra/aspects/security-baseline.js` に WAF baseline。 |
| AC-048 | scaffolded | IAM policy 実体と cdk-nag は未実装。 |
| AC-050 | scaffolded | web route source あり、E2E 未実施。 |
| AC-051 | scaffolded | `packages/ui` と `theme.css.ts` あり、architecture lint 未実装。 |
| AC-052 | scaffolded | chat UI source あり、E2E 未実施。 |
| AC-053 | scaffolded | admin UI source あり、E2E 未実施。 |
| AC-054 | not_started | axe/Playwright 未導入。 |
| AC-055 | not_started | Lighthouse/bundle analyzer 未導入。 |
| AC-060 | local_verified | local integration checks event ordering and names subset. |
| AC-061 | local_verified | `assertNotificationIsLightweight` rejects answer/chunk fields. |
| AC-062 | local_verified | event notification points to REST detail and auth is rechecked. |
| AC-063 | scaffolded | admin event names defined; publisher integration 未実装。 |
| AC-064 | implemented_unverified | `after_seq` local event API あり、disconnect E2E 未実施。 |
| AC-070 | scaffolded | `V001__initial_saphnexa_schema.sql` あり、Flyway 実行未実施。 |
| AC-071 | scaffolded | SQL migration を追加、自動 migration は未導入。 |
| AC-072 | scaffolded | major tables exist; integrity SQL 未実装。 |
| AC-073 | local_verified | owner/viewer DB-like store relation and denial tested. |
| AC-074 | implemented_unverified | event append only in store; DB trigger 未実装。 |
| AC-075 | scaffolded | reference tables and tool source あり。 |
| AC-076 | scaffolded | BM25F tables and tool source あり。 |
| AC-077 | local_verified | model catalog shared by API/store. |
| AC-080 | local_verified | 7 construct inventory exists and is tested. |
| AC-081 | requires_aws | CloudFormation inventory 未実施。 |
| AC-082 | scaffolded | DataConstruct KMS policy intent only。 |
| AC-083 | scaffolded | security baseline only。 |
| AC-084 | scaffolded | storage path implementation 未実装。 |
| AC-085 | scaffolded | single entry route/path intent only。 |
| AC-086 | scaffolded | SQS/DLQ construct intent only。 |
| AC-087 | requires_aws | Docusaurus build/publish 未実施。 |
| AC-088 | requires_aws | Allure generate/publish 未実施。 |
| AC-090 | scaffolded | fixture RAG IF あり、Agent contract test 未拡張。 |
| AC-091 | local_verified | `assertRetrievalPolicyNotRelaxed` test あり。 |
| AC-092 | local_verified | fixture RAG calls Tools functions and records `tool_invocations`. |
| AC-093 | local_verified | `kbRetrieve` requires retrieval policy and returns results. |
| AC-094 | local_verified | ACL check is called before evidence packing. |
| AC-095 | implemented_unverified | reference expansion source あり、golden 10 件未実施。 |
| AC-096 | local_verified | citation format and event detail tested locally. |
| AC-097 | implemented_unverified | evaluation metrics categories in local source. |
| AC-098 | requires_aws | RAG quality report 未作成。 |
| AC-099 | not_started | prompt injection attack test 未実装。 |
| AC-100 | scaffolded | ingestion job/raw URI source あり、PDF/KB/S3 Vectors 実行未実施。 |
| AC-101 | scaffolded | metadata source あり、metadata 検査未実装。 |
| AC-102 | scaffolded | parsed prefix source あり、artifact inventory 未実施。 |
| AC-103 | not_started | ingestion idempotency test 未実装。 |
| AC-104 | not_started | failure injection 未実装。 |
| AC-110 | not_started | JSON log schema validator 未実装。 |
| AC-111 | not_started | trace propagation 未実装。 |
| AC-112 | scaffolded | observability construct intent only。 |
| AC-113 | scaffolded | observability construct intent only。 |
| AC-114 | implemented_unverified | tool invocation audit source あり、admin audit 未実装。 |
| AC-120 | requires_aws | GitHub Actions 10 jobs 未作成。 |
| AC-121 | requires_aws | coverage threshold 未導入。 |
| AC-122 | requires_aws | real integration 未実施。 |
| AC-123 | requires_aws | E2E 未実施。 |
| AC-124 | not_started | pairwise generator 未実装。 |
| AC-125 | implemented_unverified | contract/schema source あり、generated diff check 未実装。 |
| AC-126 | requires_aws | Allure publish 未実施。 |
| AC-130 | not_started | load test 未実装。 |
| AC-131 | implemented_unverified | local API immediate accepted response; load p95 未実施。 |
| AC-132 | implemented_unverified | local started/progress event; timing p95 未実施。 |
| AC-133 | requires_aws | RAG load test 未実施。 |
| AC-134 | local_verified | lightweight notification size guard. |
| AC-135 | not_started | failure injection 未実装。 |
| AC-140 | not_started | cost estimate 未作成。 |
| AC-141 | scaffolded | OpenSearch not introduced; AWS inventory 未実施。 |
| AC-142 | scaffolded | retention baseline intent only。 |
| AC-143 | scaffolded | `docs/ops/local-verification.md` のみ、6 runbook 未完。 |
| AC-144 | not_started | DR runbook/test 未実装。 |
| AC-150 | requires_aws | P0 全 PASS ではない。 |
| AC-151 | requires_aws | P1 全 PASS ではない。 |
| AC-152 | requires_aws | P2 全 PASS ではない。 |
| AC-153 | requires_aws | defect list/issue tracker 未確認。 |
