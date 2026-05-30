import { assert, listFiles, readText } from "./lib.js";
import { apiImplementationCoverage } from "../packages/api-contract/src/implementation-coverage.js";
import { toolImplementationCoverage } from "../packages/tool-contract/src/implementation-coverage.js";

const strict = process.argv.includes("--strict");
const violations = [];

checkForbiddenImports("apps/api/src/routes", [/repositories\//, /@aws-sdk\//, /hono\/aws-lambda/], "API routes must not import repositories, AWS SDK, or Lambda runtime directly");
checkForbiddenImports("apps/api/src/schemas", [/repositories\//, /@aws-sdk\//, /hono(\/|")/], "API schemas must stay runtime independent");
checkForbiddenImports("apps/api/src/repositories", [/from "hono/, /from "react/, /apps\/web/], "API repositories must not depend on HTTP or React");
checkForbiddenImports("packages/ui/src", [/apps\//, /packages\/api-client/, /packages\/domain/, /@saphnexa\/api-client/, /@saphnexa\/domain/], "packages/ui must not import app, API client, or domain code");
checkForbiddenImports("apps/web/src/pages", [/packages\/api-client/, /@saphnexa\/api-client/, /\bfetch\(/], "Web pages must use hooks/features instead of direct API calls");

const agentFiles = listFiles(["apps/agent/src"], (path) => /\.(ts|tsx|js)$/.test(path));
for (const file of agentFiles) {
  const source = readText(file);
  if (/BedrockKnowledgeBase|bedrock-agent-runtime|from .*dsql/i.test(source)) {
    violations.push(`${file}: Agent must use Tools API for retrieval/data access boundaries`);
  }
}

for (const [operationId, coverage] of Object.entries(apiImplementationCoverage)) {
  if (coverage.route === "aggregate" || coverage.schema === "aggregate" || coverage.usecase === "aggregate") {
    assert(coverage.explicitPlannedMarker === "present" || coverage.unitTest === "planned", `${operationId} aggregate API coverage must keep an explicit migration marker`);
  }
}

for (const [operationId, coverage] of Object.entries(toolImplementationCoverage)) {
  if (coverage.route === "aggregate" || coverage.schema === "aggregate" || coverage.usecase === "aggregate") {
    assert(coverage.explicitPlannedMarker === "present" || coverage.unitTest === "planned", `${operationId} aggregate tool coverage must keep an explicit migration marker`);
  }
}

if (strict) {
  assert(violations.length === 0, `strict atomicity violations:\n${violations.join("\n")}`);
}

console.log(`atomicity check passed (${violations.length} transitional findings, strict=${strict})`);

function checkForbiddenImports(root, patterns, reason) {
  const files = listExistingFiles(root);
  for (const file of files) {
    const source = readText(file);
    for (const pattern of patterns) {
      if (pattern.test(source)) violations.push(`${file}: ${reason}: ${pattern}`);
    }
  }
}

function listExistingFiles(root) {
  try {
    return listFiles([root], (path) => /\.(ts|tsx|js)$/.test(path));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
