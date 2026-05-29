import { assert, listFiles, readJson, readText } from "./lib.js";

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
  "apps/api/src/app.ts",
  "apps/api/src/hono-openapi-app.ts",
  "apps/api/src/openapi-document.ts",
  "apps/api/src/zod-openapi-schemas.ts",
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
  "apps/web/src/pages/ChatPage.tsx",
  "apps/web/src/pages/AdminDashboardPage.tsx",
  "packages/ui/src/templates/AppShell.tsx"
]) {
  const body = readText(file);
  assert(body.includes("export "), `${file} must export its TypeScript public surface`);
}

const apiAppSource = readText("apps/api/src/app.ts");
assert(apiAppSource.includes("createSaphnexaHonoOpenApiApp"), "API app entry must use the TypeScript Hono/OpenAPI source");

const honoOpenApiSource = readText("apps/api/src/hono-openapi-app.ts");
assert(honoOpenApiSource.includes("interface ApiDispatcher"), "API Hono source must type dispatcher boundary");
assert(honoOpenApiSource.includes("buildRouteZodSchemas"), "API Hono source must use Zod route schemas");
assert(honoOpenApiSource.includes("buildOpenApiDocument"), "API Hono source must use OpenAPI document builder");

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

console.log("type surface check passed");
