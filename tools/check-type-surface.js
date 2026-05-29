import { assert, listFiles, readJson, readText } from "./lib.js";
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
  ["apps/web/package.json", "typecheck"],
  ["packages/ui/package.json", "typecheck"]
]) {
  const pkg = readJson(pkgFile);
  assert(pkg.scripts?.[script]?.includes("tsc --noEmit --project tsconfig.json"), `${pkgFile} must define TypeScript typecheck script`);
}

for (const file of [
  "packages/api-contract/src/routes.ts",
  "packages/tool-contract/src/tools.ts",
  "packages/model-catalog/src/models.ts",
  "packages/model-catalog/src/cost-estimate.ts",
  "packages/db-schema/src/tables.ts",
  "packages/rag-core/src/fixture-rag.ts",
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
  "apps/web/src/main.tsx",
  "apps/web/src/pages/ChatPage.tsx",
  "apps/web/src/pages/AdminDashboardPage.tsx",
  "packages/ui/src/templates/AppShell.tsx"
]) {
  const body = readText(file);
  assert(body.includes("export "), `${file} must export its TypeScript public surface`);
}

const apiContractTs = readText("packages/api-contract/src/routes.ts");
assert(apiContractTs.includes("export interface PublicApiRoute"), "API contract TS source must export PublicApiRoute");
assert(apiContractTs.includes("export type ApiOperationId"), "API contract TS source must export ApiOperationId");
assert(extractStringArray(apiContractTs, "apiRouteIds").length === publicApiRoutes.length, "API route id TS source count must match JS runtime");
assert(extractStringArray(apiContractTs, "apiOperationIds").length === publicApiRoutes.length, "API operation id TS source count must match JS runtime");
for (const route of publicApiRoutes) {
  assert(apiContractTs.includes(`"${route.id}"`), `API contract TS source missing ${route.id}`);
  assert(apiContractTs.includes(`"${route.operationId}"`), `API contract TS source missing ${route.operationId}`);
}

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

const apiAppSource = readText("apps/api/src/app.ts");
assert(apiAppSource.includes("createSaphnexaHonoOpenApiApp"), "API app entry must use the TypeScript Hono/OpenAPI source");

const apiLambdaSource = readText("apps/api/src/index.ts");
assert(apiLambdaSource.includes("hono/aws-lambda"), "API Lambda entry must use Hono AWS Lambda adapter");
assert(apiLambdaSource.includes("export const handler"), "API Lambda entry must export handler");

const honoOpenApiSource = readText("apps/api/src/hono-openapi-app.ts");
assert(honoOpenApiSource.includes("interface ApiDispatcher"), "API Hono source must type dispatcher boundary");
assert(honoOpenApiSource.includes("buildRouteZodSchemas"), "API Hono source must use Zod route schemas");
assert(honoOpenApiSource.includes("buildOpenApiDocument"), "API Hono source must use OpenAPI document builder");
for (const middleware of ["errorMiddleware", "requestLogMiddleware", "originMiddleware", "sessionMiddleware", "csrfBoundaryMiddleware"]) {
  assert(honoOpenApiSource.includes(middleware), `API Hono source must attach ${middleware}`);
}

const apiRepositorySource = readText("apps/api/src/repositories/dsql/apiRepository.ts");
assert(apiRepositorySource.includes("export interface DsqlApiRepository"), "API must define DSQL repository boundary");
const apiDispatchServiceSource = readText("apps/api/src/services/apiDispatchService.ts");
assert(apiDispatchServiceSource.includes("createApiDispatchServiceFromEnvironment"), "API must expose environment-based dispatch service factory");

const ragAgentSource = readText("apps/agent/src/agent/ragAgent.ts");
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

const webMainSource = readText("apps/web/src/main.tsx");
assert(webMainSource.includes("createRoot"), "Web browser entrypoint must mount React root");
assert(webMainSource.includes("<ChatApp />") && webMainSource.includes("<AdminApp />"), "Web browser entrypoint must reach Chat and Admin apps");

console.log("type surface check passed");

function extractStringArray(source, exportName) {
  const match = source.match(new RegExp(String.raw`export const ${exportName} = \[([\s\S]*?)\] as const`));
  assert(match, `${exportName} must be exported as const array`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}
