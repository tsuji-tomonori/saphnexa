import { assert, listFiles, readJson, readText } from "./lib.js";
import { execFileSync } from "node:child_process";
import { publicApiRoutes } from "../packages/api-contract/src/routes.js";
import { toolContracts } from "../packages/tool-contract/src/tools.js";
import { requiredTables } from "../packages/db-schema/src/tables.js";
import { llmModels } from "../packages/model-catalog/src/models.js";

const packageFiles = listFiles(["apps", "infra", "packages"], (path) => path.endsWith("package.json"));
for (const file of packageFiles) {
  const pkg = readJson(file);
  assert(pkg.name?.startsWith("@saphnexa/") || pkg.name === "saphnexa", `${file} has invalid package name`);
  assert(pkg.type === "module", `${file} must use ESM type=module`);
}

for (const file of listFiles(["packages/api-contract", "packages/tool-contract", "packages/domain"], (path) => path.endsWith(".js"))) {
  const body = readText(file);
  assert(body.includes("export "), `${file} must export its public surface`);
}

for (const [pkgFile, script] of [
  ["apps/api/package.json", "typecheck"],
  ["apps/agent/package.json", "typecheck"],
  ["apps/tools-api/package.json", "typecheck"],
  ["apps/workers/package.json", "typecheck"],
  ["apps/web/package.json", "typecheck"],
  ["packages/db-types/package.json", "typecheck"],
  ["packages/ui/package.json", "typecheck"]
]) {
  const pkg = readJson(pkgFile);
  assert(pkg.scripts?.[script]?.includes("tsc --noEmit --project tsconfig.json"), `${pkgFile} must define TypeScript typecheck script`);
}

const rootPackageJson = readJson("package.json");
assert(rootPackageJson.scripts?.["web:build"] === "npm run build -w @saphnexa/web", "root package must expose web:build");
assert(rootPackageJson.scripts?.["web:build:check"] === "npm run web:build && node tools/check-web-build-output.js", "root package must expose web:build:check");
const webBuildOutputCheckSource = readText("tools/check-web-build-output.js");
for (const token of [
  "apps/web/dist/index.html",
  "apps/web/dist",
  "gzipLimitBytes",
  ".css",
  ".js.map",
  "Vite build output"
]) {
  assert(webBuildOutputCheckSource.includes(token), `web build output check source missing ${token}`);
}

for (const file of [
  "packages/api-contract/src/routes.ts",
  "packages/api-client/src/client.ts",
  "packages/api-client/src/generated/operation-types.ts",
  "packages/tool-contract/src/tools.ts",
  "packages/model-catalog/src/models.ts",
  "packages/model-catalog/src/cost-estimate.ts",
  "packages/db-schema/src/tables.ts",
  "packages/db-schema/src/table-metadata.ts",
  "packages/db-types/src/index.ts",
  "packages/rag-core/src/fixture-rag.ts",
  "packages/domain/src/index.ts",
  "packages/domain/src/observability.ts",
  "packages/domain/src/store-types.ts",
  "apps/api/src/app.ts",
  "apps/api/src/index.ts",
  "apps/api/src/hono-openapi-app.ts",
  "apps/api/src/openapi-document.ts",
  "apps/api/src/zod-openapi-schemas.ts",
  "apps/api/src/middleware/csrf.ts",
  "apps/api/src/middleware/error.ts",
  "apps/api/src/middleware/origin.ts",
  "apps/api/src/middleware/request-log.ts",
  "apps/api/src/middleware/session.ts",
  "apps/api/src/repositories/dsql/apiRepository.ts",
  "apps/api/src/services/apiDispatchService.ts",
  "apps/agent/src/app.ts",
  "apps/agent/src/runtime/agentCoreHandler.ts",
  "apps/agent/src/clients/toolsApiClient.ts",
  "apps/agent/src/clients/bedrockRuntimeClient.ts",
  "apps/agent/src/clients/dsqlClient.ts",
  "apps/agent/src/agent/queryRewrite.ts",
  "apps/agent/src/agent/contextPacking.ts",
  "apps/agent/src/agent/answerGeneration.ts",
  "apps/agent/src/agent/citationBinding.ts",
  "apps/tools-api/src/app.ts",
  "apps/workers/src/event-publisher.ts",
  "apps/web/src/main.tsx",
  "apps/web/src/pages/ChatPage.tsx",
  "apps/web/src/features/chat/AssistantRuntimeBoundary.tsx",
  "apps/web/src/features/chat/MessageHistoryPanel.tsx",
  "apps/web/src/features/admin/DocumentRegistrationForm.tsx",
  "apps/web/src/features/admin/DocumentVersionLifecyclePanel.tsx",
  "apps/web/src/features/admin/IngestionJobPanel.tsx",
  "apps/web/src/features/admin/UserImportPanel.tsx",
  "apps/web/src/features/admin/UserTable.tsx",
  "apps/web/src/features/admin/DocumentTable.tsx",
  "apps/web/src/hooks/useAdminUsers.ts",
  "apps/web/src/hooks/useUserImport.ts",
  "apps/web/src/hooks/useCreateDocument.ts",
  "apps/web/src/hooks/useDocumentLifecycle.ts",
  "apps/web/src/hooks/useAdminDocuments.ts",
  "apps/web/src/hooks/useIngestionJob.ts",
  "apps/web/src/pages/AdminDashboardPage.tsx",
  "packages/ui/src/theme.css.ts",
  "packages/ui/src/atoms/Button.tsx",
  "packages/ui/src/atoms/Input.tsx",
  "packages/ui/src/atoms/Textarea.tsx",
  "packages/ui/src/organisms/Dialog.tsx",
  "packages/ui/src/organisms/Drawer.tsx",
  "packages/ui/src/organisms/Tabs.tsx",
  "packages/ui/src/templates/AppShell.tsx"
]) {
  const body = readText(file);
  assert(body.includes("export "), `${file} must export its TypeScript public surface`);
}

const uiPackageJson = readJson("packages/ui/package.json");
const webPackageJson = readJson("apps/web/package.json");
const webViteConfigTs = readText("apps/web/vite.config.ts");
const uiThemeTs = readText("packages/ui/src/theme.css.ts");
const uiButtonTs = readText("packages/ui/src/atoms/Button.tsx");
const uiDialogTs = readText("packages/ui/src/organisms/Dialog.tsx");
const uiDrawerTs = readText("packages/ui/src/organisms/Drawer.tsx");
const uiTabsTs = readText("packages/ui/src/organisms/Tabs.tsx");
const webAdminDashboardTs = readText("apps/web/src/pages/AdminDashboardPage.tsx");
assert(uiPackageJson.dependencies?.["@vanilla-extract/recipes"], "UI package must depend on vanilla-extract recipes");
assert(uiPackageJson.dependencies?.["@radix-ui/react-dialog"], "UI package must depend on Radix Dialog primitives");
assert(uiPackageJson.dependencies?.["@radix-ui/react-tabs"], "UI package must depend on Radix Tabs primitives");
assert(webPackageJson.devDependencies?.["@vanilla-extract/vite-plugin"], "Web package must install vanilla-extract Vite plugin");
assert(webViteConfigTs.includes("vanillaExtractPlugin()"), "Vite config must enable vanilla-extract plugin");
for (const token of [
  "createThemeContract",
  "createTheme",
  "@vanilla-extract/recipes",
  "buttonRecipe",
  "controlRecipe",
  "statusBadgeRecipe",
  "tabsListClass",
  "tabsTriggerClass"
]) {
  assert(uiThemeTs.includes(token), `UI theme TS source missing ${token}`);
}
assert(uiButtonTs.includes("buttonRecipe"), "Button TS source must use vanilla-extract recipe");
assert(uiDialogTs.includes("@radix-ui/react-dialog") && uiDialogTs.includes("RadixDialog.Content"), "Dialog TS source must use Radix Dialog primitive");
assert(uiDrawerTs.includes("@radix-ui/react-dialog") && uiDrawerTs.includes("RadixDialog.Content"), "Drawer TS source must use Radix Dialog primitive");
assert(uiTabsTs.includes("@radix-ui/react-tabs") && uiTabsTs.includes("RadixTabs.List") && uiTabsTs.includes("RadixTabs.Trigger"), "Tabs TS source must use Radix Tabs primitive");
assert(webAdminDashboardTs.includes("Tabs") && webAdminDashboardTs.includes("AdminActions") && webAdminDashboardTs.includes("ArtifactTable"), "Admin dashboard must organize evaluation and artifacts with Tabs");

const apiContractTs = readText("packages/api-contract/src/routes.ts");
assert(apiContractTs.includes("export interface PublicApiRoute"), "API contract TS source must export PublicApiRoute");
assert(apiContractTs.includes("export type ApiOperationId"), "API contract TS source must export ApiOperationId");
assert(extractStringArray(apiContractTs, "apiRouteIds").length === publicApiRoutes.length, "API route id TS source count must match JS runtime");
assert(extractStringArray(apiContractTs, "apiOperationIds").length === publicApiRoutes.length, "API operation id TS source count must match JS runtime");
for (const route of publicApiRoutes) {
  assert(apiContractTs.includes(`"${route.id}"`), `API contract TS source missing ${route.id}`);
  assert(apiContractTs.includes(`"${route.operationId}"`), `API contract TS source missing ${route.operationId}`);
}

const apiClientTs = readText("packages/api-client/src/client.ts");
execFileSync("node", ["tools/build-api-client-operation-types.js", "--check"], { stdio: "inherit" });
const apiClientOperationTypesTs = readText("packages/api-client/src/generated/operation-types.ts");
assert(apiClientTs.includes("apiRouteTemplates"), "API client TS source must expose API route templates");
assert(apiClientTs.includes("pathFromTemplate"), "API client TS source must derive helper paths from templates");
assert(apiClientTs.includes("ApiClientOperationTypes"), "API client TS source must export generated operation types");
assert(apiClientOperationTypesTs.includes("Generated by tools/build-api-client-operation-types.js"), "API client generated operation types must record generator source");
for (const token of [
  "requestBody: { csrf_token: string;",
  "question?: string",
  "dataset_id?: string",
  "retrieval_policy?: { top_k?: number; allowed_acl_scope_ids?: string[] }",
  "successResponse: { message_id: string; run_id: string; status: string }",
  "successResponse: { events: { tenant_id: string; chat_id: string; message_id: string; event_seq: number;",
  'event_type: "progress" | "partial" | "final" | "error"',
  "successResponse: { artifacts: { tenant_id: string; artifact_id: string;",
  "artifact_type: \"design_doc_html\" | \"allure_report\"",
  "successResponse: { chats: { tenant_id: string; chat_id: string; title: string;",
  "participants: { tenant_id: string; chat_id: string; user_id: string;",
  "metrics_json: { retrieval?: { recall_at_10?: number }",
  "items: { tenant_id: string; evaluation_run_id: string; case_id: string; status:",
  "successResponse: { cookie_issued: boolean; expires_in_seconds: number }"
]) {
  assert(apiClientOperationTypesTs.includes(token), `API client generated operation types missing field-level token ${token}`);
}
for (const route of publicApiRoutes) {
  assert(apiClientTs.includes(`${route.operationId}:`), `API client route template missing operation ${route.operationId}`);
  assert(apiClientTs.includes(route.viewerPath), `API client route template missing ${route.viewerPath}`);
  assert(
    apiClientTs.includes(`pathFromTemplate(apiRouteTemplates.${route.operationId}`),
    `API client route helper must derive ${route.operationId} from its template`
  );
  assert(apiContractTs.includes(`"${route.operationId}"`), `API contract TS source missing API client operation ${route.operationId}`);
  assert(apiContractTs.includes(`"${route.viewerPath}"`), `API contract TS source missing API client path ${route.viewerPath}`);
  assert(apiClientOperationTypesTs.includes(`${route.operationId}: {`), `API client generated operation types missing ${route.operationId}`);
  assert(apiClientOperationTypesTs.includes(`method: "${route.method}"`), `API client generated operation types missing method for ${route.operationId}`);
  assert(apiClientOperationTypesTs.includes(`viewerPath: "${route.viewerPath}"`), `API client generated operation types missing viewer path for ${route.operationId}`);
  assert(apiClientOperationTypesTs.includes(`internalPath: "${route.internalPath}"`), `API client generated operation types missing internal path for ${route.operationId}`);
  assert(apiClientOperationTypesTs.includes(`csrfRequired: ${route.csrfRequired}`), `API client generated operation types missing CSRF metadata for ${route.operationId}`);
  for (const paramName of route.viewerPath.matchAll(/\{([^}]+)\}/g)) {
    assert(apiClientTs.includes(paramName[1]), `API client parameterized route missing param ${paramName[1]}`);
    assert(apiClientOperationTypesTs.includes(`${paramName[1]}: string`), `API client generated operation params missing ${paramName[1]}`);
  }
}
assert(
  publicApiRoutes.every((route) => apiClientTs.includes(route.operationId)),
  "API client route helpers must cover every public API operation"
);
for (const token of [
  "ApiClientPath",
  "ApiClientPathTemplate",
  "ApiClientOperationIdForMethod",
  "ApiClientRequestBodyInput",
  "apiRoutes",
  "ApiClientRouteName",
  "apiGetOperation",
  "apiPostOperation",
  "apiPatchOperation",
  "apiDeleteOperation",
  "apiPatch",
  "apiDelete"
]) {
  assert(apiClientTs.includes(token), `API client TS source missing ${token}`);
}
assert(apiClientTs.includes("path: ApiClientPath"), "API client request helpers must require ApiClientPath");
assert(apiClientTs.includes("encodeURIComponent"), "API client parameterized route helpers must URL-encode parameters");

for (const file of listFiles(["apps/web/src"], (path) => path.endsWith(".ts") || path.endsWith(".tsx"))) {
  const source = readText(file);
  assert(!source.includes("apiGet<"), `${file} must use generated operation response helpers instead of apiGet<T>`);
  assert(!source.includes("apiPost<"), `${file} must use generated operation response helpers instead of apiPost<T>`);
  assert(!source.includes(" as Chat[]"), `${file} must use generated chat response item fields instead of Chat[] cast`);
  assert(!source.includes(" as EventRow[]"), `${file} must use generated event response item fields instead of EventRow[] cast`);
  assert(!source.includes(" as Artifact[]"), `${file} must use generated artifact response item fields instead of Artifact[] cast`);
  assert(!source.includes(" as AdminDocument[]"), `${file} must use generated document response item fields instead of AdminDocument[] cast`);
}
for (const token of [
  'apiGetOperation("getMe"',
  'apiGetOperation("listChatSessions"',
  'apiPostOperation("createChatSession"',
  'apiPatchOperation("updateChatSession"',
  'apiDeleteOperation("deleteChatSession"',
  'apiGetOperation("listChatParticipants"',
  'apiGetOperation("listMessages"',
  'apiPostOperation("cancelAnswerGeneration"',
  'apiPostOperation("addChatParticipant"',
  'apiPatchOperation("updateChatParticipant"',
  'apiDeleteOperation("removeChatParticipant"',
  'apiGetOperation("listMessageEvents"',
  'apiGetOperation("listFavorites"',
  'apiGetOperation("adminListUsers"',
  'apiGetOperation("getUserImport"',
  'apiGetOperation("listPublishedArtifacts"',
  'apiGetOperation("adminListDocuments"',
  'apiGetOperation("getDocument"',
  'apiGetOperation("getIngestionJob"',
  'apiGetOperation("listLlmModels"',
  'apiGetOperation("listEvaluationDatasets"',
  'apiGetOperation("getEvaluationRun"',
  'apiPostOperation("startUserImport"',
  'apiPostOperation("createDocument"',
  'apiPostOperation("createDocumentVersion"',
  'apiPostOperation("activateDocumentVersion"',
  'apiPostOperation("updateDocumentAcl"',
  'apiPostOperation("suspendDocument"',
  'apiPostOperation("retryIngestionJob"',
  'apiPostOperation("createFeedback"',
  'apiPostOperation("addFavorite"',
  'apiPostOperation("issueWsTicket"',
  'apiPostOperation("startEvaluationRun"',
  'apiDeleteOperation("deleteFavorite"'
]) {
  assert(listFiles(["apps/web/src"], (path) => path.endsWith(".ts") || path.endsWith(".tsx")).some((file) => readText(file).includes(token)), `Web source missing operation-aware helper token ${token}`);
}
const webRealtimeClientTs = readText("apps/web/src/lib/realtimeClient.ts");
const webRealtimeHookTs = readText("apps/web/src/hooks/useMessageRealtime.ts");
const webChatPageTs = readText("apps/web/src/pages/ChatPage.tsx");
const webAssistantRuntimeTs = readText("apps/web/src/lib/assistantRuntime.ts");
const webAssistantRuntimeBoundaryTs = readText("apps/web/src/features/chat/AssistantRuntimeBoundary.tsx");
assert(webRealtimeClientTs.includes("endpoint = \"/event/realtime\""), "Web realtime client must default to same-origin /event/realtime");
assert(webRealtimeClientTs.includes("ticket: input.ticket") && webRealtimeClientTs.includes("channels: input.channels"), "Web realtime client must authorize subscriptions with payload ticket and channels");
assert(!webRealtimeClientTs.includes("ticket="), "Web realtime client must not put ticket in WebSocket URL query");
assert(!webRealtimeHookTs.includes("VITE_APPSYNC_EVENTS_URL"), "Web realtime hook must not require AWS service domain env");
assert(webChatPageTs.includes("setWsChannels(ticket.channels)") && webChatPageTs.includes("events.refetch()"), "ChatPage must use ticket response channels and REST refetch after realtime notification");
assert(webChatPageTs.includes("AssistantRuntimeBoundary") && webChatPageTs.includes("submitAssistantQuestion"), "ChatPage must connect assistant runtime provider and route helper submit boundary");
assert(webChatPageTs.includes("chatIdFromPath") && webChatPageTs.includes("window.history.pushState") && webChatPageTs.includes("popstate"), "ChatPage must synchronize selected chat with /chat/:chat_id routing");
assert(webAssistantRuntimeTs.includes("submitAssistantQuestion") && webAssistantRuntimeTs.includes("apiPostOperation(") && webAssistantRuntimeTs.includes("\"submitQuestion\""), "assistant runtime must submit through generated operation helper");
assert(webAssistantRuntimeBoundaryTs.includes("AssistantRuntimeProvider") && webAssistantRuntimeBoundaryTs.includes("useLocalRuntime"), "assistant runtime boundary must provide local assistant-ui runtime");
assert(webAssistantRuntimeBoundaryTs.includes("createSaphnexaAssistantAdapter"), "assistant runtime boundary must bind the Saphnexa chat model adapter");

const toolContractTs = readText("packages/tool-contract/src/tools.ts");
assert(toolContractTs.includes("export interface ToolContract"), "Tool contract TS source must export ToolContract");
assert(extractStringArray(toolContractTs, "toolNames").length === toolContracts.length, "Tool name TS source count must match JS runtime");
assert(extractStringArray(toolContractTs, "toolOperationIds").length === toolContracts.length, "Tool operation TS source count must match JS runtime");
for (const tool of toolContracts) {
  assert(toolContractTs.includes(`"${tool.toolName}"`), `Tool contract TS source missing ${tool.toolName}`);
  assert(toolContractTs.includes(`"${tool.operationId}"`), `Tool contract TS source missing ${tool.operationId}`);
}

const modelCatalogTs = readText("packages/model-catalog/src/models.ts");
assert(modelCatalogTs.includes("export interface LlmModelCatalogEntry"), "Model catalog TS source must export LlmModelCatalogEntry");
assert(extractStringArray(modelCatalogTs, "modelIds").length === llmModels.length, "Model id TS source count must match JS runtime");
for (const model of llmModels) {
  assert(modelCatalogTs.includes(`"${model.model_id}"`), `Model catalog TS source missing ${model.model_id}`);
}

const dbSchemaTs = readText("packages/db-schema/src/tables.ts");
assert(dbSchemaTs.includes("export type RequiredTableName"), "DB schema TS source must export RequiredTableName");
assert(extractStringArray(dbSchemaTs, "requiredTableNames").length === requiredTables.length, "DB table TS source count must match JS runtime");
for (const table of requiredTables) {
  assert(dbSchemaTs.includes(`"${table}"`), `DB schema TS source missing ${table}`);
}

const dbTableMetadataTs = readText("packages/db-schema/src/table-metadata.ts");
const dbMigrationSql = readText("packages/db-migrations/migrations/V001__initial_saphnexa_schema.sql");
for (const tableName of [
  "chat_sessions",
  "chat_participants",
  "chat_messages",
  "chat_runs",
  "chat_message_events",
  "citation_records",
  "message_feedback",
  "favorites",
  "document_acl_entries",
  "ws_tickets",
  "tool_invocations",
  "evaluation_datasets",
  "evaluation_runs",
  "evaluation_run_items",
  "llm_models",
  "published_artifacts"
]) {
  assert(dbTableMetadataTs.includes(`"${tableName}"`), `DB table metadata TS source missing ${tableName}`);
  assert(dbMigrationSql.includes(`CREATE TABLE ${tableName}`), `DB migration missing ${tableName}`);
}
for (const columnName of [
  "tenant_id",
  "chat_id",
  "message_id",
  "event_seq",
  "retrieval_policy_json",
  "payload_json",
  "display_json",
  "feedback_id",
  "favorite_id",
  "rating",
  "problem_type",
  "acl_scope_id",
  "channel_scope_json",
  "tool_name",
  "viewer_path",
  "s3_prefix",
  "published_by",
  "evaluation_run_id",
  "dataset_id",
  "case_id",
  "metrics_json",
  "retrieved_context_json",
  "judge_result_json",
  "artifact_s3_prefix",
  "model_type",
  "capability_json",
  "visible_to_user",
  "allowed_role",
  "default_for_task",
  "catalog_version"
]) {
  assert(dbTableMetadataTs.includes(`"${columnName}"`), `DB table metadata TS source missing ${columnName}`);
  assert(dbMigrationSql.includes(columnName), `DB migration missing column ${columnName}`);
}
assert(dbTableMetadataTs.includes("export interface DbTableMetadata"), "DB table metadata TS source must type DbTableMetadata");
assert(dbTableMetadataTs.includes("export function getDbTableMetadata"), "DB table metadata TS source must expose getDbTableMetadata");

const dbTypesTs = readText("packages/db-types/src/index.ts");
for (const token of [
  "export interface DbRowByTable",
  "export type DbInsert",
  "export type DbUpdate",
  "export const dbTypeTableNames",
  "users",
  "web_sessions",
  "chat_sessions",
  "chat_message_events",
  "published_artifacts",
  "published_by"
]) {
  assert(dbTypesTs.includes(token), `DB shared types source missing ${token}`);
}
for (const metadataTable of extractTableNamesFromMetadata(dbTableMetadataTs)) {
  assert(dbTypesTs.includes(`${metadataTable}:`), `DB shared types source missing row type for ${metadataTable}`);
}

const ragCoreTs = readText("packages/rag-core/src/fixture-rag.ts");
const ragCoreJs = readText("packages/rag-core/src/fixture-rag.js");
for (const token of [
  "createFixtureRagAdapter",
  "createLocalTools",
  "isPromptInjectionAttempt",
  "kbRetrieve",
  "bm25Search",
  "aclCheck",
  "referenceExpand",
  "evidencePack",
  "citationFormat",
  "disable citation",
  "chunk-acl-denied"
]) {
  assert(ragCoreTs.includes(token), `RAG core TS source missing ${token}`);
  assert(ragCoreJs.includes(token), `RAG core JS runtime mirror missing ${token}`);
}
assert(ragCoreTs.includes("export interface LocalRagTools"), "RAG core TS source must type LocalRagTools");
assert(ragCoreTs.includes("export interface RagCitation"), "RAG core TS source must type RagCitation");

const domainIndexTs = readText("packages/domain/src/index.ts");
const domainIndexJs = readText("packages/domain/src/index.js");
for (const token of [
  "roles",
  "participantRoles",
  "statuses",
  "chatEventNames",
  "adminEventNames",
  "canReadChat",
  "canWriteChat",
  "canManageAdmin",
  "createErrorResponse"
]) {
  assert(domainIndexTs.includes(token), `Domain index TS source missing ${token}`);
  assert(domainIndexJs.includes(token), `Domain index JS runtime mirror missing ${token}`);
}
assert(domainIndexTs.includes("export type Role"), "Domain index TS source must export Role");
assert(domainIndexTs.includes("export type Status"), "Domain index TS source must export Status");

const observabilityTs = readText("packages/domain/src/observability.ts");
const observabilityJs = readText("packages/domain/src/observability.js");
for (const token of [
  "logSchemaRequiredFields",
  "requiredMetricCatalog",
  "requiredAlarmCatalog",
  "retentionPolicyCatalog",
  "createLogEvent",
  "assertLogSchema",
  "assertTracePropagation",
  "api_latency_ms",
  "rag_latency_ms",
  "api_5xx_alarm",
  "schema_migrations"
]) {
  assert(observabilityTs.includes(token), `Domain observability TS source missing ${token}`);
  assert(observabilityJs.includes(token), `Domain observability JS runtime mirror missing ${token}`);
}
assert(observabilityTs.includes("export interface MetricCatalogEntry"), "Domain observability TS source must type metric catalog");
assert(observabilityTs.includes("export interface LogEvent"), "Domain observability TS source must type log events");

const storeTypesTs = readText("packages/domain/src/store-types.ts");
const storeJs = readText("packages/domain/src/store.js");
for (const token of [
  "createLocalStore",
  "submitQuestion",
  "updateChat",
  "deleteChat",
  "cancelAnswerGeneration",
  "issueWsTicket",
  "consumeWsTicket",
  "listParticipants",
  "listMessages",
  "createFeedback",
  "addFavorite",
  "deleteFavorite",
  "listFavorites",
  "getEvaluationRun",
  "listAdminArtifacts"
]) {
  assert(storeTypesTs.includes(token), `Domain store TS source missing ${token}`);
  assert(storeJs.includes(token), `Domain store JS runtime mirror missing ${token}`);
}
for (const token of [
  "listDocuments",
  "getDocument",
  "getIngestionJob",
  "createDocumentVersion",
  "activateDocumentVersion",
  "updateDocumentAcl",
  "suspendDocument"
]) {
  assert(storeTypesTs.includes(token), `Domain store TS source missing ${token}`);
  assert(storeJs.includes(token), `Domain store JS runtime mirror missing ${token}`);
}
for (const token of [
  "LocalDomainState",
  "ChatSession",
  "ChatParticipant",
  "ChatRun",
  "ChatMessageEvent",
  "CitationRecord",
  "EvaluationRunItem",
  "ToolInvocationRecord"
]) {
  assert(storeTypesTs.includes(token), `Domain store TS source missing ${token}`);
}
assert(storeTypesTs.includes("export interface LocalStore"), "Domain store TS source must type LocalStore");
assert(storeTypesTs.includes("export declare function createLocalStore"), "Domain store TS source must declare createLocalStore boundary");

const apiAppSource = readText("apps/api/src/app.ts");
assert(apiAppSource.includes("createSaphnexaHonoOpenApiApp"), "API app entry must use the TypeScript Hono/OpenAPI source");

const apiLambdaSource = readText("apps/api/src/index.ts");
assert(apiLambdaSource.includes("hono/aws-lambda"), "API Lambda entry must use Hono AWS Lambda adapter");
assert(apiLambdaSource.includes("export const handler"), "API Lambda entry must export handler");

const honoOpenApiSource = readText("apps/api/src/hono-openapi-app.ts");
assert(honoOpenApiSource.includes("interface ApiDispatcher"), "API Hono source must type dispatcher boundary");
assert(honoOpenApiSource.includes("buildRouteZodSchemas"), "API Hono source must use Zod route schemas");
assert(honoOpenApiSource.includes("buildOpenApiDocument"), "API Hono source must use OpenAPI document builder");
assert(honoOpenApiSource.includes("validateSuccessResponse"), "API Hono source must validate successful dispatcher responses");
assert(honoOpenApiSource.includes("RESPONSE_VALIDATION_FAILED"), "API Hono source must map response validation failures to standard errors");
for (const middleware of ["errorMiddleware", "requestLogMiddleware", "originMiddleware", "sessionMiddleware", "csrfBoundaryMiddleware"]) {
  assert(honoOpenApiSource.includes(middleware), `API Hono source must attach ${middleware}`);
}

const apiRepositorySource = readText("apps/api/src/repositories/dsql/apiRepository.ts");
assert(apiRepositorySource.includes("export interface DsqlApiRepository"), "API must define DSQL repository boundary");
assert(apiRepositorySource.includes("export interface DsqlQueryExecutor"), "API must define DSQL query executor boundary");
assert(apiRepositorySource.includes("createDsqlApiRepository"), "API must expose DSQL repository factory");
assert(apiRepositorySource.includes('from "@saphnexa/db-types"'), "API DSQL repository must use shared DB row types");
assert(apiRepositorySource.includes("resultTable"), "API DSQL query plan must identify result table");
assert(apiRepositorySource.includes("DSQL_EXECUTOR_NOT_BOUND"), "API DSQL repository must distinguish missing executor");
assert(apiRepositorySource.includes("DSQL_OPERATION_NOT_MAPPED"), "API DSQL repository must distinguish unmapped operations");
for (const token of [
  "getMe",
  "listChatSessions",
  "createChatSession",
  "getChatSession",
  "updateChatSession",
  "deleteChatSession",
  "listChatParticipants",
  "addChatParticipant",
  "updateChatParticipant",
  "removeChatParticipant",
  "listMessages",
  "listMessageEvents",
  "cancelAnswerGeneration",
  "createFeedback",
  "listFavorites",
  "addFavorite",
  "deleteFavorite",
  "adminListUsers",
  "listPublishedArtifacts",
  "adminListDocuments",
  "getDocument",
  "createDocumentVersion",
  "activateDocumentVersion",
  "updateDocumentAcl",
  "suspendDocument",
  "getIngestionJob",
  "listLlmModels",
  "listEvaluationDatasets",
  "startEvaluationRun",
  "getEvaluationRun",
  'resultTable: "users"',
  'resultTable: "chat_sessions"',
  'resultTable: "chat_participants"',
  'resultTable: "chat_messages"',
  'resultTable: "chat_message_events"',
  'resultTable: "message_feedback"',
  'resultTable: "favorites"',
  'resultTable: "published_artifacts"',
  'resultTable: "documents"',
  'resultTable: "document_versions"',
  'resultTable: "ingestion_jobs"',
  'resultTable: "llm_models"',
  'resultTable: "evaluation_datasets"',
  'resultTable: "evaluation_runs"',
  "FROM users",
  "FROM chat_sessions",
  "FROM chat_messages",
  "LEFT JOIN message_feedback f",
  "f.user_id = :actor_id",
  "json_build_object",
  "INSERT INTO audit_events",
  "chat.session.created",
  "chat.session.title_updated",
  "chat.session.deleted",
  "after_message_id",
  "page_limit_plus_one",
  "messagePageLimit",
  "FROM chat_message_events",
  "FROM users",
  "FROM published_artifacts",
  "FROM documents",
  "FROM document_versions",
  "FROM ingestion_jobs",
  "FROM llm_models",
  "FROM evaluation_datasets",
  "FROM evaluation_runs",
  "target_model",
  "m.model_type IN ('chat', 'judge')",
  "JOIN evaluation_run_items",
  "JOIN ingestion_jobs",
  "JOIN chat_participants",
  "target_viewer",
  "demoted_owner",
  "promoted_owner",
  "target_message",
  "existing_favorite",
  "m.sender_type = 'assistant'",
  "u.role = 'admin'"
]) {
  assert(apiRepositorySource.includes(token), `API DSQL repository source missing ${token}`);
}
const apiDispatchServiceSource = readText("apps/api/src/services/apiDispatchService.ts");
assert(apiDispatchServiceSource.includes("createApiDispatchServiceFromEnvironment"), "API must expose environment-based dispatch service factory");
assert(apiDispatchServiceSource.includes("createDsqlApiRepository"), "API dispatch service must use DSQL repository factory in dsql mode");

const ragAgentSource = readText("apps/agent/src/agent/ragAgent.ts");
const agentCoreAppSource = readText("apps/agent/src/app.ts");
const agentCoreHandlerSource = readText("apps/agent/src/runtime/agentCoreHandler.ts");
const agentToolsClientSource = readText("apps/agent/src/clients/toolsApiClient.ts");
assert(agentCoreAppSource.includes('app.get("/ping"'), "Agent app must expose /ping");
assert(agentCoreAppSource.includes('app.post("/invocations"'), "Agent app must expose /invocations");
assert(agentCoreAppSource.includes("agentCoreHttpStatus(result.status)"), "Agent app must use handler status for invocation responses");
assert(agentCoreHandlerSource.includes("AgentInvocationSchema.safeParse"), "AgentCore handler must validate invocation input");
assert(agentCoreHandlerSource.includes("AgentInvocationResultSchema.safeParse"), "AgentCore handler must validate runtime output");
assert(agentCoreHandlerSource.includes("INVALID_INVOCATION_RESULT"), "AgentCore handler must reject invalid runtime outputs");
assert(agentCoreHandlerSource.includes('status: "failed"'), "AgentCore handler must map runtime exceptions to failed invocation results");
for (const token of [
  "rewriteQuery",
  "packContext",
  "generateAnswer",
  "bindCitations",
  "assertRetrievalPolicyNotRelaxed",
  "resolveAllowedAclScopeIds",
  "kbRetrieve",
  "aclCheck",
  "referenceExpand",
  "evidencePack",
  "bm25Search"
]) {
  assert(ragAgentSource.includes(token), `RAG agent runtime must include ${token}`);
}

const answerGenerationSource = readText("apps/agent/src/agent/answerGeneration.ts");
assert(answerGenerationSource.includes("insufficient_evidence"), "answer generation must refuse insufficient evidence");
assert(answerGenerationSource.includes("packedContext.evidence.length === 0"), "answer generation must gate empty evidence before generation");

const citationBindingSource = readText("apps/agent/src/agent/citationBinding.ts");
assert(citationBindingSource.includes("citationFormat"), "citation binding must use citation formatter");
assert(citationBindingSource.includes("evidence: input.evidence"), "citation binding must bind citations to evidence");

assert(agentToolsClientSource.includes("createHttpToolsApiClient"), "Agent Tools client must expose HTTP Tools API client");
assert(agentToolsClientSource.includes("toolPathByOperation"), "Agent Tools client must use contract paths by operation");
assert(agentToolsClientSource.includes("ToolsApiHttpError"), "Agent Tools client must distinguish HTTP tool failures");
for (const tool of toolContracts) {
  assert(agentToolsClientSource.includes(`"${tool.operationId}"`), `Agent Tools client source missing ${tool.operationId}`);
}

const toolsApiSource = readText("apps/tools-api/src/app.ts");
assert(toolsApiSource.includes("toolsApiOperationSchemas"), "Tools API must export operation schemas");
assert(toolsApiSource.includes("TOOL_REQUEST_INVALID"), "Tools API must map invalid requests to explicit 400 errors");
assert(toolsApiSource.includes("TOOL_RESPONSE_INVALID"), "Tools API must map invalid handler responses to explicit 500 errors");
for (const tool of toolContracts) {
  assert(toolsApiSource.includes(tool.requestSchema), `Tools API source missing ${tool.requestSchema}`);
  assert(toolsApiSource.includes(tool.responseSchema), `Tools API source missing ${tool.responseSchema}`);
  assert(toolsApiSource.includes(tool.operationId), `Tools API source missing ${tool.operationId}`);
}

const workerEventPublisherTs = readText("apps/workers/src/event-publisher.ts");
const workerEventPublisherJs = readText("apps/workers/src/event-publisher.js");
for (const token of [
  "createLightweightNotification",
  "assertNotificationIsLightweight",
  "detail_url",
  "/api/chat-sessions/",
  "answer_text",
  "citation_text",
  "retrieved_chunk_text",
  "content_text",
  "4096"
]) {
  assert(workerEventPublisherTs.includes(token), `Workers event publisher TS source missing ${token}`);
  assert(workerEventPublisherJs.includes(token), `Workers event publisher JS runtime mirror missing ${token}`);
}
assert(workerEventPublisherTs.includes("export interface LightweightNotification"), "Workers event publisher TS source must type LightweightNotification");
assert(workerEventPublisherTs.includes("export const forbiddenNotificationFields"), "Workers event publisher TS source must export forbiddenNotificationFields");
assert(workerEventPublisherTs.includes("export const maxNotificationPayloadBytes"), "Workers event publisher TS source must export maxNotificationPayloadBytes");

const webMainSource = readText("apps/web/src/main.tsx");
assert(webMainSource.includes("createRoot"), "Web browser entrypoint must mount React root");
assert(webMainSource.includes("<ChatApp />") && webMainSource.includes("<AdminApp />"), "Web browser entrypoint must reach Chat and Admin apps");

console.log("type surface check passed");

function extractStringArray(source, exportName) {
  const match = source.match(new RegExp(String.raw`export const ${exportName} = \[([\s\S]*?)\] as const`));
  assert(match, `${exportName} must be exported as const array`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function extractTableNamesFromMetadata(source) {
  return [...source.matchAll(/table\("([^"]+)"/g)].map((match) => match[1]);
}
