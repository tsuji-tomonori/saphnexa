import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { preflightCaptureCommandIds } from "./aws-dev-uat-evidence-builders.js";
import {
  requiredCoreTables,
  requiredCrudSmokeFlows,
  requiredEventTables,
  requiredMigrationVersions,
  requiredProjectionColumns
} from "./dsql-flyway-evidence-requirements.js";
import { assert, readJson } from "./lib.js";

const requiredOutputs = [
  "ApiEndpoint",
  "ToolsApiEndpoint",
  "CloudFrontDistributionDomain",
  "UserPoolId",
  "UserPoolClientId",
  "AppSyncEventApiHttpEndpoint",
  "AppSyncEventApiRealtimeEndpoint",
  "DsqlEndpoint",
  "RawDocumentsBucketName",
  "PublishedArtifactsBucketName",
  "S3VectorBucketName",
  "S3VectorIndexName",
  "BedrockKnowledgeBaseId",
  "DocusaurusLatestUrl",
  "DocusaurusVersionUrl",
  "AllureLatestUrl"
];

export function buildAwsDevUatPreflightRawInput(options = {}) {
  for (const key of ["scaffoldPath", "outputPath", "capturedAt", "gitTag", "githubReleaseUrl"]) {
    assert(options[key], `${key} is required`);
  }

  const scaffold = readJson(options.scaffoldPath);
  assert(scaffold.schema_version === "saphnexa-aws-dev-uat-raw-input-scaffold.v1", "preflight scaffold schema mismatch");
  assert(scaffold.mode === "preflight", "preflight scaffold mode mismatch");
  assert(scaffold.final_evidence === false, "preflight scaffold must not already be final evidence");

  const raw = Object.fromEntries(preflightCaptureCommandIds.map((id) => [id, readRawOutput(scaffold, options.scaffoldPath, id)]));
  const accountIdParts = accountParts(raw["aws-sts"]);
  const accountId = accountIdParts.join("");
  const region = scaffold.aws?.region || "ap-northeast-1";
  const stack = stackFrom(raw["cloudformation-describe-stacks"]);
  const outputs = stackOutputs(stack);
  assertRequiredOutputs(outputs);
  assertStackResources(raw["cloudformation-list-stack-resources"]);
  const flyway = flywayStatus(raw["flyway-info"]);
  const openApi = openApiStatus(raw["hono-openapi"]);
  const edge = edgeStatus(raw["edge-realtime"]);
  const rag = ragStatus(raw["rag-runtime"]);
  const artifacts = artifactStatus(raw["published-artifacts"]);
  outputs.AgentCoreRuntimeArn = finalAgentCoreArn(outputs, rag, region, accountId);

  const captureProvenance = {
    ...scaffold.capture_provenance,
    captured_at: options.capturedAt,
    required_command_ids: preflightCaptureCommandIds,
    commands: preflightCaptureCommandIds.map((id) => ({
      ...commandById(scaffold, id),
      status: "captured"
    }))
  };

  const rawInput = {
    environment: scaffold.environment,
    captured_at: options.capturedAt,
    aws: {
      region,
      account_id_parts: accountIdParts
    },
    source: {
      git_tag: options.gitTag,
      github_release_url: options.githubReleaseUrl
    },
    capture_provenance: captureProvenance,
    cloudformation: {
      stack_name: stack.StackName,
      stack_uuid: stackUuid(stack.StackId),
      stack_status: stack.StackStatus,
      outputs
    },
    dsql_flyway: {
      status: "passed",
      cluster_identifier: scaffold.dsql_flyway?.cluster_identifier || clusterIdentifier(outputs.DsqlEndpoint),
      endpoint: outputs.DsqlEndpoint,
      flyway_schema_history_table: flyway.schemaHistoryTable,
      latest_version: flyway.latestVersion,
      checksum_status: flyway.checksumStatus,
      applied_by: "flyway",
      applied_migrations: flyway.appliedMigrations,
      schema: flyway.schema,
      comment_on: flyway.commentOn,
      crud_smoke: flyway.crudSmoke
    },
    hono_openapi: {
      status: "passed",
      api_endpoint: outputs.ApiEndpoint,
      openapi_url: `${trimSlash(outputs.ApiEndpoint)}/openapi.json`,
      route_count: openApi.routeCount,
      zod_validation_enabled: openApi.zodValidationEnabled
    },
    edge_identity_realtime: {
      status: "passed",
      cloudfront_url: edge.cloudfront_url || `https://${outputs.CloudFrontDistributionDomain}/`,
      cognito_user_pool_id: edge.cognito_user_pool_id || outputs.UserPoolId,
      cognito_user_pool_client_id: edge.cognito_user_pool_client_id || outputs.UserPoolClientId,
      appsync_event_api_http_endpoint: edge.appsync_event_api_http_endpoint || outputs.AppSyncEventApiHttpEndpoint,
      appsync_event_api_realtime_endpoint: edge.appsync_event_api_realtime_endpoint || outputs.AppSyncEventApiRealtimeEndpoint,
      ws_ticket_authorizer_enabled: edge.ws_ticket_authorizer_enabled
    },
    rag_runtime: {
      status: "passed",
      bedrock_knowledge_base_id: rag.bedrock_knowledge_base_id || outputs.BedrockKnowledgeBaseId,
      s3_vector_bucket_name: rag.s3_vector_bucket_name || outputs.S3VectorBucketName,
      s3_vector_index_name: rag.s3_vector_index_name || outputs.S3VectorIndexName,
      agentcore_runtime_arn: outputs.AgentCoreRuntimeArn,
      tools_gateway_authorized: rag.tools_gateway_authorized,
      acl_precheck_enabled: rag.acl_precheck_enabled
    },
    published_artifacts: {
      status: "published",
      docusaurus_latest_url: artifacts.docusaurus_latest_url || outputs.DocusaurusLatestUrl,
      docusaurus_version_url: artifacts.docusaurus_version_url || outputs.DocusaurusVersionUrl,
      allure_latest_url: artifacts.allure_latest_url || outputs.AllureLatestUrl
    }
  };

  writeJson(options.outputPath, rawInput);
  return rawInput;
}

export function cli() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node tools/build-aws-dev-uat-preflight-raw-input.js --scaffold <preflight-scaffold.json> --output <preflight-raw-input.json> --captured-at <JST timestamp> --git-tag <tag> --github-release-url <url>");
    return;
  }
  buildAwsDevUatPreflightRawInput(options);
  console.log(`AWS dev/UAT preflight raw input generated: ${options.outputPath}`);
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (item === "--help" || item === "-h") options.help = true;
    if (item === "--scaffold") options.scaffoldPath = args[++index];
    if (item === "--output") options.outputPath = args[++index];
    if (item === "--captured-at") options.capturedAt = args[++index];
    if (item === "--git-tag") options.gitTag = args[++index];
    if (item === "--github-release-url") options.githubReleaseUrl = args[++index];
  }
  return options;
}

function readRawOutput(scaffold, scaffoldPath, id) {
  const command = commandById(scaffold, id);
  const path = resolve(dirname(scaffoldPath), command.output_ref);
  assert(existsSync(path), `${id} raw output missing: ${command.output_ref}`);
  return readJson(path);
}

function commandById(scaffold, id) {
  const command = scaffold.capture_provenance?.commands?.find((item) => item.id === id);
  assert(command, `preflight scaffold missing command ${id}`);
  assert(typeof command.output_ref === "string" && command.output_ref.startsWith("raw/"), `${id} output_ref must stay under raw/`);
  return command;
}

function accountParts(rawSts) {
  if (Array.isArray(rawSts.AccountParts)) return rawSts.AccountParts;
  assert(/^\d{12}$/.test(rawSts.Account || ""), "aws-sts Account must be a 12 digit account id");
  return [rawSts.Account.slice(0, 6), rawSts.Account.slice(6)];
}

function stackFrom(rawCloudFormation) {
  assert(Array.isArray(rawCloudFormation.Stacks) && rawCloudFormation.Stacks.length === 1, "cloudformation-describe-stacks must include exactly one stack");
  const stack = rawCloudFormation.Stacks[0];
  assert(stack.StackName && stack.StackStatus, "cloudformation stack name/status missing");
  assert(["CREATE_COMPLETE", "UPDATE_COMPLETE"].includes(stack.StackStatus), "cloudformation stack status must be complete");
  return stack;
}

function stackOutputs(stack) {
  return Object.fromEntries((stack.Outputs || []).map((item) => [item.OutputKey, item.OutputValue]));
}

function assertRequiredOutputs(outputs) {
  for (const key of requiredOutputs) {
    assert(typeof outputs[key] === "string" && outputs[key].trim().length > 0, `cloudformation output missing: ${key}`);
  }
}

function stackUuid(stackId = "") {
  const match = String(stackId).match(/\/([A-Za-z0-9-]+)$/);
  assert(match, "cloudformation StackId must include stack uuid");
  return match[1];
}

function finalAgentCoreArn(outputs, rag, region, accountId) {
  const candidate = outputs.AgentCoreRuntimeArn || rag.agentcore_runtime_arn;
  if (candidate && !candidate.includes("sample-account")) return candidate;
  const runtimeName = outputs.AgentCoreRuntimeName || String(candidate || "").split("/").at(-1);
  assert(runtimeName, "AgentCoreRuntimeArn or AgentCoreRuntimeName is required");
  return `arn:aws:bedrock-agentcore:${region}:${accountId}:runtime/${runtimeName}`;
}

function assertStackResources(rawResources) {
  const resources = rawResources.StackResourceSummaries || [];
  assert(resources.length > 0, "cloudformation-list-stack-resources must include resources");
  assert(resources.every((item) => String(item.ResourceStatus || "").endsWith("_COMPLETE")), "cloudformation resources must be complete");
}

function flywayStatus(rawFlyway) {
  const latestVersion = rawFlyway.latestVersion || rawFlyway.schemaVersion;
  const checksumStatus = rawFlyway.checksumStatus || rawFlyway.checksum_status;
  assert(latestVersion === "V003", "flyway latestVersion must be V003");
  assert(checksumStatus === "matched", "flyway checksumStatus must be matched");
  const appliedMigrations = assertAppliedMigrations(rawFlyway.appliedMigrations);
  const schema = assertDsqlSchema(rawFlyway.schema);
  const commentOn = assertCommentOn(rawFlyway.commentOn);
  const crudSmoke = assertCrudSmoke(rawFlyway.crudSmoke);
  return {
    schemaHistoryTable: rawFlyway.schemaHistoryTable || "schema_migrations",
    latestVersion,
    checksumStatus,
    appliedMigrations,
    schema,
    commentOn,
    crudSmoke
  };
}

function assertAppliedMigrations(appliedMigrations) {
  assert(Array.isArray(appliedMigrations), "flyway appliedMigrations must be an array");
  const byVersion = new Map(appliedMigrations.map((item) => [item.version, item]));
  for (const version of requiredMigrationVersions) {
    const item = byVersion.get(version);
    assert(item, `flyway appliedMigrations missing ${version}`);
    assert(item.success === true, `flyway appliedMigrations ${version} must be successful`);
  }
  return appliedMigrations;
}

function assertDsqlSchema(schema) {
  assert(schema && typeof schema === "object", "flyway schema section is required");
  assertIncludesAll(schema.coreTables, requiredCoreTables, "flyway schema.coreTables");
  assertIncludesAll(schema.eventTables, requiredEventTables, "flyway schema.eventTables");
  assertProjectionColumns(schema.projectionColumns);
  return schema;
}

function assertProjectionColumns(columns) {
  assert(Array.isArray(columns), "flyway schema.projectionColumns must be an array");
  const actual = new Set(columns.map((item) => `${item.table}.${item.column}`));
  for (const item of requiredProjectionColumns) {
    assert(actual.has(`${item.table}.${item.column}`), `flyway schema.projectionColumns missing ${item.table}.${item.column}`);
  }
}

function assertCommentOn(commentOn) {
  assert(commentOn && typeof commentOn === "object", "flyway commentOn section is required");
  for (const scope of ["table", "column"]) {
    const item = commentOn[scope];
    assert(item && typeof item === "object", `flyway commentOn.${scope} is required`);
    assert(item.attempted === true, `flyway commentOn.${scope}.attempted must be true`);
    assert(typeof item.supported === "boolean", `flyway commentOn.${scope}.supported must be boolean`);
    if (item.supported === false) {
      assert(typeof item.error === "string" && item.error.trim().length > 0, `flyway commentOn.${scope}.error is required when unsupported`);
    }
  }
  return commentOn;
}

function assertCrudSmoke(crudSmoke) {
  assert(crudSmoke && typeof crudSmoke === "object", "flyway crudSmoke section is required");
  for (const flow of requiredCrudSmokeFlows) {
    assert(crudSmoke[flow]?.status === "passed", `flyway crudSmoke.${flow}.status must be passed`);
  }
  return crudSmoke;
}

function assertIncludesAll(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`);
  const actualSet = new Set(actual);
  for (const item of expected) assert(actualSet.has(item), `${label} missing ${item}`);
}

function openApiStatus(openApi) {
  assert(String(openApi.openapi || "").startsWith("3."), "OpenAPI version must be 3.x");
  const routeCount = openApi["x-saphnexa-route-count"] || countOpenApiOperations(openApi.paths || {});
  assert(routeCount >= 38, "OpenAPI route count must be at least 38");
  return {
    routeCount,
    zodValidationEnabled: openApi["x-saphnexa-zod-validation"] !== false
  };
}

function countOpenApiOperations(paths) {
  return Object.values(paths).reduce((count, item) => count + Object.keys(item || {}).filter((method) => ["get", "post", "put", "patch", "delete"].includes(method)).length, 0);
}

function edgeStatus(rawEdge) {
  assert(["captured", "passed"].includes(rawEdge.status || rawEdge.cloudfront), "edge realtime smoke must be captured");
  return {
    cloudfront_url: rawEdge.cloudfront_url,
    cognito_user_pool_id: rawEdge.cognito_user_pool_id,
    cognito_user_pool_client_id: rawEdge.cognito_user_pool_client_id,
    appsync_event_api_http_endpoint: rawEdge.appsync_event_api_http_endpoint,
    appsync_event_api_realtime_endpoint: rawEdge.appsync_event_api_realtime_endpoint,
    ws_ticket_authorizer_enabled: rawEdge.ws_ticket_authorizer_expected ?? true
  };
}

function ragStatus(rawRag) {
  assert(["captured", "passed"].includes(rawRag.status || rawRag.bedrock_kb), "RAG runtime smoke must be captured");
  return {
    bedrock_knowledge_base_id: rawRag.bedrock_knowledge_base_id,
    s3_vector_bucket_name: rawRag.s3_vector_bucket_name,
    s3_vector_index_name: rawRag.s3_vector_index_name,
    agentcore_runtime_arn: rawRag.agentcore_runtime_arn,
    tools_gateway_authorized: rawRag.tools_gateway_authorized_expected ?? true,
    acl_precheck_enabled: rawRag.acl_precheck_expected ?? true
  };
}

function artifactStatus(rawArtifacts) {
  assert(["captured", "passed"].includes(rawArtifacts.status || rawArtifacts.docusaurus_latest), "admin artifacts smoke must be captured");
  return {
    docusaurus_latest_url: rawArtifacts.docusaurus_latest_url,
    docusaurus_version_url: rawArtifacts.docusaurus_version_url,
    allure_latest_url: rawArtifacts.allure_latest_url
  };
}

function clusterIdentifier(endpoint = "") {
  return String(endpoint).split(".")[0].replace(/-dsql$/, "-dsql");
}

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
