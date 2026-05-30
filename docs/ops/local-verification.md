# Local Verification

## 目的

`.workspace/local.md` の方針に合わせ、ローカルでは契約、認可、非同期 event、RAG Tools 境界、UI の相対 path 方針を検証する。

## コマンド

```bash
npm run typecheck
npm run test:contract
npm run contract-mirror:check
npm run api:openapi:generate
npm run api:openapi:check
npm run check:no-src-js
npm run api:implementation:check
npm run tools:implementation:check
npm run implementation-coverage:check
npm run check:implementation-coverage-source
npm run model-catalog:check
npm run agent:policy:check
npm run check:atomicity
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
npm run web:build
npm run web:build:check
npm run web:perf:local
npm run web:bundle:check
npm run perf:api:local
npm run failure:check
npm run rag:quality:check
npm run rag:security:check
npm run rag:aws-binding:check
npm run rag:perf:local
npm run rag-core:check
npm run workers:check
npm run db:metadata:check
npm run db-schema:tables:check
npm run domain:check
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
npm run aws:dev-uat:operator-input:build
npm run aws:dev-uat:operator-input:check
npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved
npm run aws:dev-uat:operator-input:fixture:check
npm run aws:dev-uat:operator-runbook:build
npm run aws:dev-uat:operator-runbook:check
npm run aws:dev-uat:operator-runbook:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved
npm run aws:dev-uat:operator-runbook:fixture:check
npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>
npm run aws:dev-uat:raw-output:fixture:check
npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>
npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>
npm run aws:dev-uat:raw-input:fixture:check
npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input <raw-preflight-input.json> --validation-raw-input <raw-validation-input.json> --preflight-evidence dist/acceptance/aws_dev_uat_preflight.json --validation-evidence dist/acceptance/aws_dev_uat_validation.json --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json
npm run aws:dev-uat:evidence-bundle:fixture:check
npm run aws:dev-uat:capture-helpers:check
npm run aws:dev-uat:preflight-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json --output <raw-preflight-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url>
npm run aws:dev-uat:preflight-raw-input:fixture:check
npm run aws:dev-uat:validation-capture:fixture:check
npm run aws:dev-uat:validation-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json --output <raw-validation-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url> --aws-account-id <aws-account-id>
npm run aws:dev-uat:validation-raw-input:fixture:check
npm run aws:dev-uat:materialized-flow:fixture:check
npm run aws:dev-uat:final-readiness:check
npm run aws:dev-uat:final-readiness:fixture:check
npm run aws:dev-uat:operator-handoff:check
npm run aws:dev-uat:operator-handoff:fixture:check
npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>
npm run aws:dev-uat:validation:check
npm run aws:dev-uat:validation:fixture:check
npm run aws:dev-uat:evidence:fixture:check
npm test
git diff --check
```

## ローカルで確認できること

- 公開 API 40 件と Tools API 6 件の contract metadata。
- `npm run contract-mirror:check` が `packages/api-contract/src/routes.ts` と `packages/tool-contract/src/tools.ts` から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
- API route、Tools API、model catalog、required DB tables の TypeScript source が generated JS runtime mirror と件数・主要 ID で同期していること。
- Tools API 6 件が `toolContracts` の operationId / path に沿った Zod request/response schema を持ち、invalid request は 400、handler response schema drift は 500 として分離されること。
- `@saphnexa/api-client` が API contract 由来の全 40 public route helper と viewer path template を TypeScript source として持ち、Web の主要 fetch が `/api/*` typed route helper を使うこと。
- `@saphnexa/api-client` が API contract / OpenAPI document 由来の generated operation type map を持ち、method、viewer path、internal path、params、query、request body、success response、error response、主要 outer fields、代表的な nested object / array item fields を drift check で同期確認すること。
- Web の主要 API 呼び出しが `apiGetOperation` / `apiPostOperation` を使い、手書き response generic や配列要素 cast ではなく generated operation response 型から受け取ること。
- `packages/db-schema` が required table 名に加えて主要 DB table metadata を TypeScript source として持ち、Flyway SQL migration の主要 table/column token と同期していること。
- `packages/db-types` が DB metadata 由来の主要 table row/insert/update 型を TypeScript source として持ち、API DSQL query plan が result table と shared DB row 型を参照すること。
- `npm run typecheck` が source gate と `tsc --noEmit --project tsconfig.typecheck.json` の両方を実行し、API / Agent / Tools API / Web / UI / shared contract の TypeScript source を実コンパイルすること。
- `packages/rag-core` が typed RAG adapter/tools boundary を TypeScript source として持ち、`npm run rag-core:check` で生成される `.js` runtime mirror と主要 tool/policy token が同期していること。
- `apps/agent` が retrieval policy guard を TypeScript source として持ち、`npm run agent:policy:check` で生成される `.js` runtime mirror と policy relaxation token が同期していること。
- `packages/domain` が role/status/event/helper、observability catalog、local store 境界を TypeScript source として持ち、既存 `.js` runtime mirror と主要 token が同期していること。
- `apps/workers` が lightweight notification boundary を TypeScript source として持ち、`npm run workers:check` で生成される `.js` runtime mirror と禁止フィールド、4KB payload 上限、REST detail URL が同期していること。
- Hono/Zod/OpenAPI 実装 entrypoint が 40 route と `/openapi.json` を route contract から生成し、CSRF/role/Zod validation metadata と主要 success response の runtime validation 境界を保持すること。
- `npm run api:openapi:check` が `apps/api/src/hono-openapi-app.ts`、`openapi-document.ts`、`zod-openapi-schemas.ts`、middleware TS から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
- `npm run check:no-src-js` が `apps/**/src` と `packages/**/src` の JavaScript runtime compatibility surface を allowlist で明示し、`--strict` では production-ready TypeScript source-of-truth として残存 JS を拒否すること。
- `npm run api:implementation:check` が `packages/api-contract/src/implementation-coverage.js` の 40 public API operation について route、schema、usecase、local fixture、production、repository、event、audit、test の coverage metadata と planned marker を検査すること。`npm run api:implementation:check:production` は planned marker を拒否する。
- `npm run tools:implementation:check` が `packages/tool-contract/src/implementation-coverage.js` の 6 Tools API operation について route、schema、usecase、policy、runtime validation、audit、timeout、production の coverage metadata と planned marker を検査すること。`npm run tools:implementation:check:production` は planned marker を拒否する。
- `npm run implementation-coverage:check` が `packages/api-contract/src/implementation-coverage.ts` と `packages/tool-contract/src/implementation-coverage.ts` から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
- `npm run check:implementation-coverage-source` が coverage manifest の TypeScript source 型制約、generated `.js` runtime mirror marker、operation/status token drift がないことを検査すること。
- `npm run model-catalog:check` が `packages/model-catalog/src/models.ts` と `packages/model-catalog/src/cost-estimate.ts` から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
- `npm run agent:policy:check` が `apps/agent/src/agent/retrievalPolicy.ts` から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
- `npm run rag-core:check` が `packages/rag-core/src/fixture-rag.ts` から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
- `npm run workers:check` が `apps/workers/src/event-publisher.ts` から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
- `npm run db:metadata:check` が `packages/db-migrations/migrations/V001__initial_saphnexa_schema.sql` から生成される `packages/db-schema/src/table-metadata.js` と `.ts` の一致を検査すること。
- `npm run check:atomicity` が API route/schema/repository、Web page、UI package、Agent retrieval/data access の依存境界を検査し、現行 aggregate implementation は planned marker として追跡すること。`npm run check:atomicity:strict` は移行猶予の違反を拒否する。
- API が `hono/aws-lambda` handler entrypoint、request log / origin / error / session / CSRF middleware 境界、dispatch service、DSQL repository interface、operation-level SQL plan、DSQL query executor interface、shared DB row type boundary を TypeScript source として持つこと。
- API の Hono app factory、OpenAPI document builder、Zod schema catalog が TypeScript source of record を持ち、主要 success response の concrete Zod schema と既存 Node local tools 用の `.js` runtime mirror が同期していること。
- `apps/api`、`apps/tools-api`、`apps/agent` が TypeScript entry を持ち、AgentCore Runtime 互換の `/ping` / `/invocations` contract、invocation input/output validation、runtime failure containment、Agent から Tools API HTTP endpoint への client boundary を source-level で確認できること。
- Agent TypeScript runtime が query rewrite、DSQL ACL scope 解決、BM25 / KB retrieve、ACL check、reference expand、evidence pack、context packing、answer generation、citation binding の責務境界を持ち、evidence 不足時は回答生成に進まず refusal とすること。
- `apps/web` が React + Vite + TypeScript package として成立し、TanStack Query hook、assistant-ui runtime adapter/provider 境界、Atomic Design UI package を通して chat/admin source gate を満たすこと。Chat UI は `AssistantRuntimeProvider` / `useLocalRuntime`、`Sidebar` / `MessageThread` organism を通して runtime 境界、navigation、event thread を表示すること。
- `packages/ui` が shadcn/ui 系の所有 component 方針に沿って、vanilla-extract の `createThemeContract` / recipes、Radix Dialog primitive、Vite vanilla-extract plugin 境界を source gate で確認できること。実ブラウザ visual regression は別途確認する。
- Admin Dashboard が Saphnexa UI package の Radix Tabs organism を使い、評価操作と公開成果物一覧を実データ由来の管理領域として分割すること。CSV/Excel 実アップロード、実 PDF upload、取り込み監視の未実装 backend を架空 UI で実装済みに見せないこと。
- Admin Dashboard のユーザータブが `adminListUsers` / `startUserImport` / `getUserImport` route helper / generated operation helper を使い、JSON rows 入力で local user import 結果と行別エラーを確認できること。CSV/Excel 実アップロード、Cognito 実反映、AppSync 通知は未接続であることを表示すること。
- Admin Dashboard の文書タブが `adminListDocuments` route helper / generated operation helper を使い、local API と DSQL query plan の管理者限定文書一覧境界を source gate で確認できること。文書がない場合は正直な empty state を表示すること。
- Admin Dashboard の文書登録フォームが React Hook Form + Zod と `createDocument` route helper / generated operation helper を使い、文書種別、有効期間、登録後の文書一覧 query 再取得を source gate で確認できること。実 PDF upload は未接続であることを表示すること。
- Admin Dashboard の文書版 lifecycle が React Hook Form + Zod と `getDocument` / `createDocumentVersion` / `activateDocumentVersion` route helper / generated operation helper を使い、文書詳細、文書版、ACL、取り込みジョブ、取り込み完了済み版だけの active 化を source gate で確認できること。実 PDF upload、Step Functions 実行、Bedrock KB / S3 Vectors ingestion は未接続であることを表示すること。
- Admin Dashboard の文書 ACL 更新が React Hook Form + Zod と `updateDocumentAcl` route helper / generated operation helper を使い、管理者だけが対象文書版の `document_acl_entries` を置換する境界を source gate で確認できること。Cognito group 反映、Bedrock KB / S3 Vectors metadata 再同期、実 retrieval index 再構築は未接続であることを表示すること。
- Admin Dashboard の文書公開停止が `suspendDocument` route helper / generated operation helper を使い、管理者だけが文書と文書版を logical delete 状態へ更新する境界を source gate で確認できること。物理削除、S3 object delete、Bedrock KB / S3 Vectors delete、保持期間後 lifecycle 実行は未接続であることを表示すること。
- Admin Dashboard の取り込みジョブ確認が React Hook Form + Zod と `getIngestionJob` / `retryIngestionJob` route helper / generated operation helper を使い、status 由来の進捗 percentage 表示と retryable な失敗ジョブだけを再実行できる境界を source gate で確認できること。実 Step Functions / S3 / KB ingestion は未接続であること。
- `npm run web:build` が Vite production build を実行し、Chat/Admin browser entrypoint を bundle できること。
- `npm run web:build:check` が Vite production build output の `apps/web/dist/index.html`、hashed JS asset、JS sourcemap、gzip size 上限を検査すること。
- Chat UI が React Hook Form + Zod validation、events payload 由来の Citation Drawer、AppSync Events / WebSocket client boundary を持ち、未接続時に架空 realtime event を生成しないこと。
- Chat UI が `createChatSession` route helper / generated operation helper を使い、新規チャット作成後に作成者が owner 参加者として登録され、作成したチャットを選択できること。`/chat/:chat_id` route metadata と ChatPage の `history.pushState` / `popstate` 境界により、選択 chat と browser path を同期すること。ChatPage は chat 未作成状態の初回質問送信時に質問文由来タイトルで chat を作成し、作成した chat を選択してから質問送信と WS ticket 発行を継続すること。DSQL repository が `createChatSession` / `getChatSession` query plan を持ち、参加者だけが detail、participants、messages を取得できること。chat session lifecycle は `audit_events` に追記すること。SQS/AppSync publish、実ブラウザ E2E は別途確認する。
- Chat UI が `listMessages` route helper / generated operation helper を使い、参加中チャットのユーザー質問と assistant 回答、閲覧者本人の feedback state、message paging cursor、message ごとの citation records を source/local gate で再表示できること。他参加者の feedback rating/comment を message history に漏らさないこと。実ブラウザ E2E は別途確認する。
- Chat UI が `cancelAnswerGeneration` route helper / generated operation helper を使い、owner または投稿者本人による回答生成キャンセル要求、viewer/outsider の拒否、`chat.run.canceled` event と canceled status を source/local gate で確認できること。実 AgentCore Runtime 停止、SQS event-publish、AppSync fan-out、streaming 中断、実ブラウザ E2E は別途確認する。
- Chat UI が `listChatParticipants` route helper / generated operation helper を使い、参加中チャットの参加者、ロール、共有者、共有日時を source/local gate で確認できること。
- Chat UI が `updateChatSession` / `deleteChatSession` route helper / generated operation helper を使い、owner によるチャットタイトル更新と論理削除、viewer/outsider の拒否、削除後の一覧・通常取得からの除外、`audit_events` への `chat.session.title_updated` / `chat.session.deleted` 追記を source/local gate で確認できること。保持期間後の物理削除、SQS/AppSync publish、実ブラウザ E2E は別途確認する。
- Chat UI が `addChatParticipant` / `updateChatParticipant` / `removeChatParticipant` route helper / generated operation helper を使い、owner による viewer 共有、viewer 再有効化、共有解除、active viewer への owner 移譲を source/local gate で確認できること。任意 owner 昇格、実 AppSync Events fan-out、実ブラウザ E2E は別途確認する。
- Chat UI が `createFeedback` route helper / generated operation helper を使い、閲覧可能な回答への高評価・低評価・コメント登録を source/local gate で確認できること。フィードバック一覧、取消、実ブラウザ E2E は別途確認する。
- Chat UI が `listFavorites` / `addFavorite` / `deleteFavorite` route helper / generated operation helper を使い、参加チャットと回答単位のお気に入り登録、一覧、解除、重複排除を source/local gate で確認できること。実ブラウザ E2E は別途確認する。
- Web realtime client が同一 origin の `/event/realtime` を default endpoint とし、ticket を WebSocket URL query に載せず subscribe payload で送り、API が返した channel と通知後の REST refetch に接続されていること。
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
- Bedrock KB / S3 Vectors / AgentCore Runtime / AgentCore Gateway Target が Tools API、ACL precheck、S3 Vectors metadata、DSQL endpoint と source-level で接続されていること。実 AgentCore Gateway 認可、実 Bedrock KB Retrieve、実 DSQL ACL query、実 HTTP logs による結合確認は AWS dev/UAT 検証で別途実施する。
- local RAG timing smoke で初回通知と最終回答の p95 が基準を満たすこと。
- Flyway versioned SQL migration の命名、schema_migrations、required tables、checksum、自動 migration 不採用。実 Aurora DSQL introspection 由来の完全生成 DB type と実 Flyway apply は AWS dev/UAT 検証で別途確認する。
- `npm run db-schema:tables:check` が `packages/db-schema/src/tables.ts` から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
- `npm run domain:check` が `packages/domain/src/index.ts` と `packages/domain/src/observability.ts` から生成される `.js` runtime mirror と committed mirror の一致を検査すること。
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
- `npm run aws:dev-uat:raw-capture-plan:check` が `dist/acceptance/aws_dev_uat_raw_capture_plan.json` を生成し、preflight / validation の command id、`output_ref`、preflight `materialize_command`、validation `materialize_command`、raw output/input check command、build command、final command が builder と同期していることを検査すること。
- `npm run aws:dev-uat:raw-input-scaffold:check` が `dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json` と `dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json` を生成し、raw capture plan の command id、command、`output_ref` と同期していること、かつ `pending_capture` の未捕捉 draft として final evidence ではないことを検査すること。
- `npm run aws:dev-uat:operator-input:check` が `dist/acceptance/aws_dev_uat_operator_input.scaffold.json` を生成し、raw capture plan、preflight / validation scaffold、resolved operator input path、release/AWS/test/report 入力、resolved operator input check command、materialize command template と同期していることを検査すること。
- `npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved` が operator の resolved operator input から `<release-tag>`、`<aws-account-id>`、`sample`、`mock`、`localhost`、空値、不正 GitHub release URL、不正 AWS account id を reject すること。
- `npm run aws:dev-uat:operator-input:fixture:check` が resolved operator input の positive path と、scaffold の誤用、未解決 placeholder、不正 AWS account id、不正 release URL、未解決 S3 URI の negative path を検査すること。
- `npm run aws:dev-uat:operator-runbook:check` が `dist/acceptance/aws_dev_uat_operator_execution_runbook.json` を生成し、未解決 operator input では `requires_resolved_operator_input` として external execution ready にしないこと、resolved runbook の validation phase が `npm run test:e2e:aws`、`npm run perf:aws`、`npm run rag:quality:aws`、`npm run aws:dev-uat:validation:final` の suite gate commands を順序どおり持つことを検査すること。
- `npm run aws:dev-uat:operator-runbook:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved` が resolved operator input から release、deploy_publish、preflight_capture、preflight_materialization、validation_capture、validation_materialization、final_gates、final_acceptance の command order、confirmation gate、stop condition、evidence output を検査し、未解決 placeholder を reject すること。
- `npm run aws:dev-uat:operator-runbook:fixture:check` が operator execution runbook の resolved ready path、validation suite gate command order、placeholder 混入、確認なし外部 phase、phase order mismatch の negative path を検査すること。
- `npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>` と `npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>` が raw input の `output_ref` 参照先を読み、JSON output の parse と text output の non-empty を検査すること。
- `npm run aws:dev-uat:raw-output:fixture:check` が sample raw output の positive path と、parse 不能 JSON、空 text、sample/fixture text rejection を検査すること。
- `npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>` と `npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>` が operator 入力を一時ディレクトリで evidence build し、既存 final gate 相当を通すこと。
- `npm run aws:dev-uat:raw-input:fixture:check` が sample raw input の dry-run positive path と、scaffold / `pending_capture` rejection を検査すること。
- `npm run aws:dev-uat:evidence-bundle:check -- ...` が preflight / validation の raw input、raw output、final evidence、execution bridge を束ね、各 artifact の path、size、sha256 を `dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json` に記録すること。
- `npm run aws:dev-uat:evidence-bundle:fixture:check` が sample bundle manifest の positive path と missing artifact の negative path を検査すること。
- `npm run aws:dev-uat:capture-helpers:check` が raw capture plan に listed された repo-local helper entrypoint の help と missing-env failure を検査すること。
- `npm run aws:dev-uat:validation-capture:fixture:check` が validation raw output capture helper の help、missing-env failure、閾値未達 failure、valid env JSON output を検査すること。
- `npm run aws:dev-uat:validation-raw-input:build -- ...` が validation scaffold と raw output files から final validation raw input を生成すること。
- `npm run aws:dev-uat:validation-raw-input:fixture:check` が materialized raw input を raw output check、raw input dry-run、validation final gate へ通せることを検査すること。
- `npm run aws:dev-uat:materialized-flow:fixture:check` が materialized flow fixture として preflight / validation scaffold から raw input を生成し、raw output/input check、preflight/validation final evidence build、validation suite gate、raw input/output/final evidence/execution bridge を含む evidence bundle manifest まで一気通貫で検査すること。
- `npm run aws:dev-uat:final-readiness:check` が final readiness manifest を生成し、raw capture plan、execution bridge、resolved operator input、ready operator execution runbook、current git commit、preflight/validation raw input、final evidence、evidence bundle manifest、blockers、next commands を記録すること。evidence bundle manifest は `schema_version`、`status`、`evidence_class`、current git commit、artifact count、artifact coverage、current readiness artifact path match、current artifact digest/size match、all bundle artifact metadata match、all bundle artifact scope match を検査する。実 evidence、resolved operator input、ready operator execution runbook、current git commit のいずれかがなければ `blocked_by_external_execution` として残す。
- `npm run aws:dev-uat:final-readiness:fixture:check` が final readiness manifest の missing evidence / missing raw input / missing operator input / invalid operator input / stale operator input / missing operator runbook / invalid operator runbook / stale operator runbook / invalid evidence bundle manifest / stale evidence bundle manifest / mismatched evidence bundle artifact path / mismatched evidence bundle artifact digest / mismatched raw-output artifact digest / out-of-scope bundle artifact と ready evidence path を fixture で検査し、missing raw input の `next_commands` が capture plan / scaffold / materialize / raw output-input check / final evidence build / final gate まで辿れ、missing operator input / runbook の `next_commands` が scaffold/build/check から resolved check まで辿れることを検査すること。
- `npm run aws:dev-uat:operator-handoff:check` が operator handoff artifact を生成し、external action plan、raw capture plan、final readiness manifest、承認必須 action、critical command order、evidence outputs、blockers、next commands、evidence input map、final readiness bundle gate summary を集約すること。evidence input map は preflight / validation raw input path、raw output/input check command、final evidence path、build/final command、evidence bundle manifest path と bundle check command を `required_inputs.evidence` に持つこと。bundle gate summary は artifact count、coverage、metadata match、scope match、invalid/stale flags を `final_readiness_summary.evidence_bundle` に持つこと。
- `npm run aws:dev-uat:operator-handoff:fixture:check` が operator handoff の pending / requires_confirmation / AWS not-ready branch、evidence input map、final readiness bundle gate summary を fixture で検査すること。
- `npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>` が実 AWS E2E・性能・RAG品質 raw result から `dist/acceptance/aws_dev_uat_validation.json` を生成すること。
- `npm run aws:dev-uat:validation:check` が E2E・性能・RAG品質結果の fixture 構造と閾値を検査し、`npm run aws:dev-uat:validation:fixture:check` が fixture/negative path を検査し、実証跡では `npm run test:e2e:aws`、`npm run perf:aws`、`npm run rag:quality:aws`、`npm run aws:dev-uat:validation:final` が必要であること。
- `npm run aws:dev-uat:evidence:fixture:check` が sample raw input を一時ディレクトリへ変換し、既存 final checker で builder output を検査すること。raw input の `capture_provenance` 欠落時と `output_ref` 参照先欠落時に builder が fail することも検査する。
- GitHub issue tracker snapshot に基づく Blocker/Critical open defect 0 件の defect list draft。最終検収では `gh issue list --state open --json number,title,labels,state` による defect-snapshot-refresh が必要であり、ローカル snapshot だけでは完了扱いにしないこと。
- `npm run db:metadata:check` が V001 全テーブル・全カラムの metadata、日本語説明、domain、sourceOfTruth、保持方針、PII分類、更新主体と generated metadata source drift を検査すること。
- `npm run db:comments:check` が `packages/db-schema` metadata から `packages/db-migrations/generated/schema-comments.sql` と `docs/generated/db/schema-comments.sql` を生成し、`COMMENT ON TABLE/COLUMN` 件数が table/column 件数と一致することを検査すること。
- `npm run db:event-source:check` が v0.17 案Bの domain event table、projection metadata columns、状態系カラムの「正本ではなくprojection」分類、`chat_message_events` と domain event 正本の違いを検査すること。
- `npm run db:docs:check` が `docs/generated/db/tables.md`、`columns.md`、`er.md`、`lifecycle.md`、`projections.md`、`schema-comments.sql` を生成・検査すること。
- `npm run db:dsql-compat:check` が migration 本体に未検証の `COMMENT ON` を入れていないこと、Aurora DSQL COMMENT ON は実機検証 TODO として扱い `docs/generated/db/schema-comments.sql` をコメント正本にすることを検査すること。
- `npm run db:dsql-compat:check` が Aurora DSQL の `1 DDL / transaction` 制約に合わせ、複数DDLを含むFlyway migrationを `packages/db-migrations/flyway-dsql.conf` の `flyway.executeInTransaction=false` で実行する方針を検査すること。DSQL実適用ではこのprofileを使い、DDLとDMLを別transactionに分ける。
- `npm run check:dead` が Knip相当の entry/project 設定を検査すること。
- `npm run check:deps` が dependency-cruiser相当の apps/packages 依存境界を検査すること。
- `npm run check:secrets` が Gitleaks相当の secret pattern gate を検査すること。
- `npm run check:functional` が class / this / let / mutation 抑制方針と許可境界を検査すること。
- `npm run check:static` が typecheck、lint、source JS transition allowlist、API/Tools implementation coverage、coverage TS source drift、atomicity、Knip相当、dependency-cruiser相当、Gitleaks相当、DB metadata/comment/event/docs/DSQL、functional lint gate をまとめて検査すること。

## ローカルでは完了扱いにしないこと

- Aurora DSQL COMMENT ON の実機可否。`COMMENT ON TABLE/COLUMN` SQL は `docs/generated/db/schema-comments.sql` と `packages/db-migrations/generated/schema-comments.sql` に生成するが、DSQL本体のmigrationには入れない。実接続環境で可否を確認できるまでは metadata と generated docs をコメント正本として扱う。
- Aurora DSQL へのFlyway実適用。local gateは `flyway.executeInTransaction=false` 方針と `1 DDL / transaction` 制約への静的対応を検査するが、実DSQL clusterへのapply証跡ではない。
- AWS dev/UAT での Cognito、DSQL、S3、CloudFront、AppSync Events、Bedrock KB、S3 Vectors、AgentCore の実接続。
- Hono runtime の実 Lambda 起動、Cognito authorizer、CSRF cookie integration、CloudFront 経由の実 HTTP request。`apps/api/src/index.ts` は Lambda handler source と local success response validation boundary を持つが、AWS 上での起動確認と実 HTTP validation は別途行う。
- API TypeScript source of record は source gate と実 `tsc --noEmit` で検査する。DSQL repository は read系 operation の SQL plan と executor interface までを検査し、実 Aurora DSQL driver、IAM auth token、connection pool、`.ts` からの runtime bundle 生成は別途確認する。既存 local tools/tests は標準 `node` 実行のため `.js` runtime mirror を使う。
- RAG core TypeScript source は source gate と実 `tsc --noEmit` で検査する。既存 local tools/tests は標準 `node` 実行のため `.js` runtime mirror を使い、`npm run rag-core:check` で `.ts` からの runtime artifact 生成 drift を確認する。
- Agent policy TypeScript source は source gate と実 `tsc --noEmit` で検査する。既存 local tests は標準 `node` 実行のため `.js` runtime mirror を使い、`npm run agent:policy:check` で `.ts` からの runtime artifact 生成 drift を確認する。
- Domain TypeScript source は source gate と実 `tsc --noEmit` で検査する。既存 local tools/tests は標準 `node` 実行のため `.js` runtime mirror を使う。`.ts` からの runtime artifact 生成、実 DSQL/Cognito/AppSync 接続は別途確認する。
- Workers TypeScript source は source gate と実 `tsc --noEmit` で検査する。既存 local tools/tests は標準 `node` 実行のため `.js` runtime mirror を使い、`npm run workers:check` で `.ts` からの runtime artifact 生成 drift を確認する。実 AppSync Events publish / WebSocket push は別途確認する。
- `aws-cdk-lib` / `constructs` install 後の実 `cdk synth`、CDK bootstrap、CDK deploy、CloudFormation change set 実行。
- CDK deploy、CloudFormation outputs、S3 inventory、CloudWatch logs、CloudFront/S3/Docusaurus/Allure 公開 URL。
- `aws s3 sync dist/admin/docs/versions/v0.17/ ...` と Allure run別 publish の実行結果。
- CloudFormation `describe-stacks` / `list-stack-resources` の実取得と、AC-081 の最終 PASS 判定。
- GitHub issue tracker の最終再取得と、AC-153 の最終 PASS 判定。
- axe/Playwright の実 DOM accessibility report、Lighthouse CI、本番 bundler の analyzer report、AWS load test。
- UI theme / recipe / Radix primitive 境界は source gate、`tsc --noEmit`、Vite production build で確認する。実ブラウザ visual regression、dark/density theme の実切替、全 shadcn/ui component 群の網羅は別途確認する。
- Chat 参加者一覧の local gate は参加者による対象チャット参加者一覧取得と未参加者拒否を確認する。
- Chat message history の local gate は参加者による対象チャットメッセージ一覧取得、ユーザー質問と assistant 回答の復元、閲覧者本人の feedback state 復元、message paging cursor、message ごとの citation records 復元、他参加者 feedback 非開示、未参加者拒否を確認する。実ブラウザ操作、実 Aurora DSQL での SQL 実行は別途確認する。
- Chat 共有操作の local gate は owner による viewer 共有、viewer / outsider の共有操作拒否、viewer 解除後の閲覧拒否、viewer 再有効化、active viewer への owner 移譲、旧 owner の viewer 降格、active owner が 1 人だけ残ること、viewer / outsider の owner 移譲拒否、owner 削除拒否を確認する。任意 owner 昇格、実 AppSync Events fan-out、実ブラウザ操作、実 Aurora DSQL での SQL 実行は別途確認する。
- Chat フィードバックの local gate は参加者による対象回答への登録と未参加者拒否を確認する。フィードバック一覧、取消、分析集計、実ブラウザ操作、実 Aurora DSQL での SQL 実行は別途確認する。
- Admin ユーザー取込の source gate は `adminListUsers`、JSON rows による `startUserImport`、`getUserImport` の結果集計と行別エラー、管理者ロール境界を確認する。CSV/Excel binary upload、S3 import file 配置、Cognito 実反映、AppSync 完了通知は別途実装・検証する。
- Admin Tabs の source gate は評価操作と公開成果物一覧の画面構造を確認する。CSV/Excel 実アップロード、実 PDF upload、取り込み監視の実 backend/API/UI は別途実装・検証する。
- Chat お気に入りの local gate は参加チャット単位と回答単位の登録、一覧、解除、重複排除、所有者境界、assistant message 以外の拒否を確認する。実ブラウザ操作、実 Aurora DSQL での SQL 実行は別途確認する。
- Admin 文書一覧の source gate は既存文書の表示と `adminListDocuments` 境界を確認する。実 PDF upload、ACL 編集、取り込みジョブ詳細は別途実装・検証する。
- Admin 文書登録フォームの source gate は `createDocument` API 境界、CSRF disabled state、local ingestion job 受付、文書種別、有効期間、文書一覧再取得を確認する。実 S3 PDF upload、ACL 編集、取り込みジョブ詳細は別途実装・検証する。
- Admin 文書版 lifecycle の source gate は `getDocument` の versions / ingestion jobs / ACL entries、`createDocumentVersion` による local 版追加、`activateDocumentVersion` の取り込み完了条件、管理者ロール境界を確認する。文書停止・削除、実 S3 PDF upload、実 Step Functions 実行、Bedrock KB / S3 Vectors ingestion は別途実装・検証する。
- Admin 文書 ACL 更新の source gate は `updateDocumentAcl` の CSRF / admin role boundary、対象文書版の `document_acl_entries` 置換、文書詳細再取得を確認する。Cognito group 反映、Bedrock KB / S3 Vectors metadata 再同期、実 retrieval index 再構築は別途実装・検証する。
- Admin 文書公開停止の source gate は `suspendDocument` の CSRF / admin role boundary、文書と文書版の logical delete、文書一覧からの除外を確認する。物理削除、S3 object delete、Bedrock KB / S3 Vectors delete、保持期間後 lifecycle 実行は別途実装・検証する。
- Admin 取り込みジョブ確認の source gate は job ID 指定の `getIngestionJob`、status 由来の進捗 percentage、retryable state、`retryIngestionJob`、管理者ロール境界を確認する。実 Step Functions 実行、S3 raw/parsed 実配置、Bedrock KB / S3 Vectors ingestion、job 一覧 API は別途実装・検証する。
- Admin 評価実行確認の source/local gate は `listEvaluationDatasets`、`listLlmModels`、`startEvaluationRun`、`getEvaluationRun` の route helper / generated operation helper、管理者ロール境界、DSQL plan、評価データセット一覧、モデル一覧、選択した `model_id` の送信、評価run詳細、case別 `evaluation_run_items` と metrics 表示を確認する。`listLlmModels` は general_user に visible な chat model のみ、admin に visible model と admin judge model を返し、system-only embedding model を返さないことを local gate で確認する。`startEvaluationRun` は unknown model と system-only embedding model を拒否し、未指定時に `logical-chat-default` へ解決することを確認する。実 Step Functions 評価runner、Bedrock Evaluations job、評価 HTML report、AppSync fan-out、実ブラウザ E2E は別途実装・検証する。
- 実ブラウザ操作による chat/admin E2E、CloudFront 経由のロール別導線確認。
- Bedrock KB、S3 Vectors、AgentCore Runtime、Bedrock Evaluations を使った実 RAG 品質評価。
- TypeScript framework 境界は local/source gate、実 `tsc --noEmit`、Vite production build と build output check で確認する。assistant-ui runtime provider は source gate と Vite production build で React tree への接続を確認するが、assistant-ui runtime の実ブラウザ streaming 挙動、AppSync Events の実 subscribe は、実 runtime が揃った環境で別途確認する。`/event/realtime` の browser source contract は検査するが、実 AppSync Events 接続成功の証跡ではない。
- Shared contract TypeScript source は source gate で確認する。DB introspection/codegen、`.ts` source からの runtime artifact 生成は別途確認する。
- API client route helper、generated operation type map、operation-aware Web request helper は source gate と実 `tsc --noEmit` で全 public route の operation/path/request/response、主要 outer field、代表的な chat/event/artifact/evaluation の nested object / array item field 同期を確認する。全 route 全 field の完全 schema 化、実 CloudFront/Cognito 経由 HTTP request は別途確認する。
- DB table metadata TypeScript source は migration source 由来の static metadata として検査する。`npm run db:metadata:build` は `packages/db-schema/src/table-metadata.js` と `.ts` を生成し、`npm run db:metadata:check` は committed generated source との drift を検査する。実 DSQL introspection、生成 DB types、Flyway 実適用は別途確認する。
- Agent runtime pipeline は source-level の責務境界、invocation schema validation、runtime failure containment、local fixture tests で確認する。実 Bedrock Runtime 生成、AgentCore Runtime `/invocations` の AWS HTTP 実行、AgentCore Gateway Target 経由の Tools API 呼び出し、Aurora DSQL ACL query は AWS 接続後に別途確認する。
- Aurora DSQL への Flyway 実適用、CloudWatch metrics/alarms、S3 lifecycle、DSQL retention settings の実リソース確認。
- CloudFront Function、WAF、IAM policy、KMS key policy、SQS/DLQ、AppSync Events、cdk-nag の実リソース/実行結果確認。
- 実 S3 の offline artifact inventory、実 parser/KB/S3 Vectors ingestion、実バックアップからの restore drill。
- `npm run aws:dev-uat:preflight` は fixture の構造確認だけを行う。実 AWS dev/UAT 証跡は `dist/acceptance/aws_dev_uat_preflight.json` を `evidence_class: aws-captured` で作成し、`npm run aws:dev-uat:preflight:final` を通す必要がある。
- `npm run aws:dev-uat:evidence:fixture:check` は builder の構造確認だけを行う。sample raw input は最終検収や AWS dev/UAT 実行完了の根拠にしない。
- raw input の `capture_provenance` は、取得コマンドと raw output ref の監査用 metadata である。`output_ref` は raw input ファイルからの相対パスで、参照先ファイルが存在する必要がある。実 AWS credentials と raw output 本体がなければ、最終検収 evidence として扱わない。
- `npm run aws:dev-uat:execution-bridge:probe` は AWS credentials と final evidence file の有無を記録するだけであり、deploy、migration、publish、load test、Bedrock Evaluations は実行しない。
- `npm run aws:dev-uat:raw-capture-plan:check` は raw capture plan の生成と構造検査だけを行う。plan に listed された command の実行や raw output の取得は行わない。
- `npm run aws:dev-uat:raw-input-scaffold:check` は raw input scaffold の生成と構造検査だけを行う。`pending_capture` の scaffold は final raw input ではなく、実 AWS raw output、`captured_at`、`capture_provenance.commands[].status: captured`、参照先 `output_ref` が揃うまで最終検収 evidence として扱わない。
- `npm run aws:dev-uat:operator-input:check` は operator input scaffold の生成と構造検査だけを行う。resolved operator input が pass しても、実 AWS credentials、実 raw output、実 deploy/publish、実 E2E・性能・RAG品質結果の代替にはしない。
- `npm run aws:dev-uat:operator-input:fixture:check` は resolved operator input fixture の構造確認だけを行う。実 AWS dev/UAT 完了の根拠にはしない。
- `npm run aws:dev-uat:operator-runbook:check` は operator execution runbook の生成と構造検査だけを行う。resolved operator input が pass しても、runbook は release 作成、deploy、migration、publish、E2E、負荷試験、Bedrock Evaluations、signoff を実行しないため、実 AWS dev/UAT 完了の根拠にはしない。
- `npm run aws:dev-uat:operator-runbook:fixture:check` は operator execution runbook fixture の構造確認だけを行う。実 AWS dev/UAT 完了の根拠にはしない。
- `npm run aws:dev-uat:raw-output:fixture:check` は sample raw output の形式確認だけを行う。実 AWS credentials、実 raw output、実 deploy/publish がなければ最終検収 evidence として扱わない。
- `npm run aws:dev-uat:raw-input:fixture:check` は sample raw input の dry-run 構造確認だけを行う。実 AWS credentials、実 raw output、実 deploy/publish がなければ最終検収 evidence として扱わない。
- `npm run aws:dev-uat:evidence-bundle:fixture:check` は sample bundle manifest の構造確認だけを行う。実 AWS credentials、実 raw output、final evidence、execution bridge が揃わなければ最終検収 evidence として扱わない。
- `npm run aws:dev-uat:capture-helpers:check` は helper の `--help` と missing-env failure だけを確認する。実環境 URL への HTTP probe は、必須 env を指定して helper を明示実行した場合だけ行う。
- `npm run aws:dev-uat:validation-capture:fixture:check` は helper の構造確認だけを行う。実 E2E 実行、負荷試験、Bedrock Evaluations job 実行、CloudFront log 取得は行わない。
- `npm run aws:dev-uat:validation-raw-input:fixture:check` は sample raw output から raw input を生成する構造確認だけを行う。実 E2E・性能・RAG品質結果の代替にはしない。
- `npm run aws:dev-uat:materialized-flow:fixture:check` は sample raw output から raw input、final evidence、bundle manifest を生成する materialized flow fixture であり、実 AWS credentials、実 raw output、実 deploy/publish、実 E2E・性能・RAG品質結果の代替にはしない。
- `npm run aws:dev-uat:final-readiness:check` は final readiness manifest を生成するだけで、deploy、migration、publish、E2E、負荷試験、Bedrock Evaluations は実行しない。実 evidence、AWS credentials、resolved operator input、ready operator execution runbook、current git commit が揃わなければ ready にはしない。
- `npm run aws:dev-uat:final-readiness:fixture:check` は sample evidence による構造確認だけを行う。実 AWS dev/UAT 完了の根拠にはしない。
- `npm run aws:dev-uat:operator-handoff:check` は operator handoff artifact を生成するだけで、release 作成、deploy、migration、publish、E2E、負荷試験、Bedrock Evaluations、signoff は実行しない。承認必須 action は pending のまま残す。
- `npm run aws:dev-uat:operator-handoff:fixture:check` は handoff 構造確認だけを行う。実 AWS dev/UAT 完了の根拠にはしない。
- `npm run aws:dev-uat:validation:check` は fixture の構造確認だけを行う。実 AWS dev/UAT E2E・性能・RAG品質証跡は `dist/acceptance/aws_dev_uat_validation.json` を `evidence_class: aws-captured` で作成し、final suite gate を通す必要がある。
- Git tag、GitHub release、検収用 `evidence_manifest.json` の最終確定。
- 外部 action plan に記載された release、deploy、publish、AWS dev/UAT validation、CloudFormation capture、defect snapshot refresh、final evidence 作成、signoff の実行。
- 検収 checklist の最終署名、AWS account id、CloudFormation stack id、公開済み docs/Allure URL の確定。
- P0/P1/P2 全行の最終 PASS 判定。
