import { existsSync } from "node:fs";
import {
  requiredCoreTables,
  requiredCrudSmokeFlows,
  requiredEventTables,
  requiredMigrationVersions,
  requiredProjectionColumns
} from "./dsql-flyway-evidence-requirements.js";
import { assert, readJson } from "./lib.js";

const args = new Set(process.argv.slice(2));
const path = [...args].find((item) => !item.startsWith("--")) || "docs/acceptance/evidence/aws_dev_uat_preflight.example.json";
const requireFinal = args.has("--require-final");

assert(existsSync(path), `AWS dev/UAT preflight evidence missing: ${path}`);
const evidence = readJson(path);

assert(evidence.schema_version === "saphnexa-aws-dev-uat-preflight.v1", "schema_version mismatch");
assert(["fixture", "aws-captured"].includes(evidence.evidence_class), "evidence_class must be fixture or aws-captured");
const isFixture = evidence.evidence_class === "fixture";
if (requireFinal) {
  assert(!isFixture, "--require-final rejects fixture evidence");
}
assert(["dev", "uat"].includes(evidence.environment), "environment must be dev or uat");
assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(evidence.captured_at || ""), "captured_at must be JST timestamp");
assertAws(evidence.aws);
assertSource(evidence.source);
assertDsqlFlyway(evidence.dsql_flyway);
assertHonoOpenApi(evidence.hono_openapi);
assertCloudFormation(evidence.cloudformation);
assertEdgeIdentityRealtime(evidence.edge_identity_realtime);
assertRagRuntime(evidence.rag_runtime);
assertPublishedArtifacts(evidence.published_artifacts);
assertDevUatValidation(evidence.dev_uat_validation);

console.log(`AWS dev/UAT preflight check passed: ${path}${requireFinal ? " (final)" : ""}`);

function assertAws(aws) {
  assert(aws && typeof aws === "object", "aws section is required");
  assert(
    isFixture ? aws.account_id === "fixture-aws-account-id" : /^[0-9]{12}$/.test(aws.account_id || ""),
    "aws.account_id must be a 12 digit account id for final evidence"
  );
  assert(aws.region === "ap-northeast-1", "aws.region must be ap-northeast-1");
}

function assertSource(source) {
  assert(source && typeof source === "object", "source section is required");
  assert(/^[a-f0-9]{40}$/.test(source.git_commit_sha || ""), "source.git_commit_sha must be a 40 character hex SHA");
  assertFinalText(source.git_tag, "source.git_tag");
  assertHttpsUrl(source.github_release_url, "source.github_release_url");
  assert(source.github_release_url.endsWith(`/releases/tag/${encodeURIComponent(source.git_tag)}`), "source.github_release_url must match git_tag");
}

function assertDsqlFlyway(section) {
  assertSectionStatus(section, "dsql_flyway", "passed");
  assertFinalText(section.cluster_identifier, "dsql_flyway.cluster_identifier");
  assertDnsName(section.endpoint, "dsql_flyway.endpoint");
  assert(section.flyway_schema_history_table === "schema_migrations", "dsql_flyway.flyway_schema_history_table must be schema_migrations");
  assert(section.latest_version === "V003", "dsql_flyway.latest_version must be V003");
  assert(section.checksum_status === "matched", "dsql_flyway.checksum_status must be matched");
  assert(section.applied_by === "flyway", "dsql_flyway.applied_by must be flyway");
  if (isFixture) return;
  assertAppliedMigrations(section.applied_migrations);
  assertDsqlSchema(section.schema);
  assertCommentOn(section.comment_on);
  assertCrudSmoke(section.crud_smoke);
}

function assertAppliedMigrations(appliedMigrations) {
  assert(Array.isArray(appliedMigrations), "dsql_flyway.applied_migrations must be an array");
  const byVersion = new Map(appliedMigrations.map((item) => [item.version, item]));
  for (const version of requiredMigrationVersions) {
    const item = byVersion.get(version);
    assert(item, `dsql_flyway.applied_migrations missing ${version}`);
    assert(item.success === true, `dsql_flyway.applied_migrations ${version} must be successful`);
  }
}

function assertDsqlSchema(schema) {
  assert(schema && typeof schema === "object", "dsql_flyway.schema is required");
  assertIncludesAll(schema.coreTables, requiredCoreTables, "dsql_flyway.schema.coreTables");
  assertIncludesAll(schema.eventTables, requiredEventTables, "dsql_flyway.schema.eventTables");
  assertProjectionColumns(schema.projectionColumns);
}

function assertProjectionColumns(columns) {
  assert(Array.isArray(columns), "dsql_flyway.schema.projectionColumns must be an array");
  const actual = new Set(columns.map((item) => `${item.table}.${item.column}`));
  for (const item of requiredProjectionColumns) {
    assert(actual.has(`${item.table}.${item.column}`), `dsql_flyway.schema.projectionColumns missing ${item.table}.${item.column}`);
  }
}

function assertCommentOn(commentOn) {
  assert(commentOn && typeof commentOn === "object", "dsql_flyway.comment_on is required");
  for (const scope of ["table", "column"]) {
    const item = commentOn[scope];
    assert(item && typeof item === "object", `dsql_flyway.comment_on.${scope} is required`);
    assert(item.attempted === true, `dsql_flyway.comment_on.${scope}.attempted must be true`);
    assert(typeof item.supported === "boolean", `dsql_flyway.comment_on.${scope}.supported must be boolean`);
    if (item.supported === false) {
      assertFinalText(item.error, `dsql_flyway.comment_on.${scope}.error`);
    }
  }
}

function assertCrudSmoke(crudSmoke) {
  assert(crudSmoke && typeof crudSmoke === "object", "dsql_flyway.crud_smoke is required");
  for (const flow of requiredCrudSmokeFlows) {
    assert(crudSmoke[flow]?.status === "passed", `dsql_flyway.crud_smoke.${flow}.status must be passed`);
  }
}

function assertIncludesAll(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`);
  const actualSet = new Set(actual);
  for (const item of expected) assert(actualSet.has(item), `${label} missing ${item}`);
}

function assertHonoOpenApi(section) {
  assertSectionStatus(section, "hono_openapi", "passed");
  assertHttpsUrl(section.api_endpoint, "hono_openapi.api_endpoint");
  assertHttpsUrl(section.openapi_url, "hono_openapi.openapi_url");
  assert(section.openapi_url.endsWith("/openapi.json"), "hono_openapi.openapi_url must point to /openapi.json");
  assert(section.route_count >= 38, "hono_openapi.route_count must cover public API routes");
  assert(section.zod_validation_enabled === true, "hono_openapi.zod_validation_enabled must be true");
}

function assertCloudFormation(section) {
  assertSectionStatus(section, "cloudformation", "deployed");
  assertFinalText(section.stack_name, "cloudformation.stack_name");
  assertArn(section.stack_id, "cloudformation.stack_id", "cloudformation");
  assert(["CREATE_COMPLETE", "UPDATE_COMPLETE"].includes(section.stack_status), "cloudformation.stack_status must be CREATE_COMPLETE or UPDATE_COMPLETE");
  const outputs = section.outputs || {};
  for (const key of [
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
    "AgentCoreRuntimeArn",
    "DocusaurusLatestUrl",
    "AllureLatestUrl"
  ]) {
    assertFinalText(outputs[key], `cloudformation.outputs.${key}`);
  }
  assertHttpsUrl(outputs.ApiEndpoint, "cloudformation.outputs.ApiEndpoint");
  assertHttpsUrl(outputs.ToolsApiEndpoint, "cloudformation.outputs.ToolsApiEndpoint");
  assertDnsName(outputs.CloudFrontDistributionDomain, "cloudformation.outputs.CloudFrontDistributionDomain");
  assert(outputs.UserPoolId.startsWith("ap-northeast-1_"), "cloudformation.outputs.UserPoolId must be ap-northeast-1 Cognito user pool id");
  assertHttpsUrl(outputs.AppSyncEventApiHttpEndpoint, "cloudformation.outputs.AppSyncEventApiHttpEndpoint");
  assertWssUrl(outputs.AppSyncEventApiRealtimeEndpoint, "cloudformation.outputs.AppSyncEventApiRealtimeEndpoint");
  assertDnsName(outputs.DsqlEndpoint, "cloudformation.outputs.DsqlEndpoint");
  assertArn(outputs.AgentCoreRuntimeArn, "cloudformation.outputs.AgentCoreRuntimeArn", "bedrock-agentcore");
  assertAdminArtifactUrl(outputs.DocusaurusLatestUrl, "cloudformation.outputs.DocusaurusLatestUrl", "/admin/docs/latest/");
  assertAdminArtifactUrl(outputs.AllureLatestUrl, "cloudformation.outputs.AllureLatestUrl", "/admin/test-reports/allure/latest/");
}

function assertEdgeIdentityRealtime(section) {
  assertSectionStatus(section, "edge_identity_realtime", "passed");
  assertHttpsUrl(section.cloudfront_url, "edge_identity_realtime.cloudfront_url");
  assert(section.cognito_user_pool_id.startsWith("ap-northeast-1_"), "edge_identity_realtime.cognito_user_pool_id must be ap-northeast-1 Cognito user pool id");
  assertFinalText(section.cognito_user_pool_client_id, "edge_identity_realtime.cognito_user_pool_client_id");
  assertHttpsUrl(section.appsync_event_api_http_endpoint, "edge_identity_realtime.appsync_event_api_http_endpoint");
  assertWssUrl(section.appsync_event_api_realtime_endpoint, "edge_identity_realtime.appsync_event_api_realtime_endpoint");
  assert(section.ws_ticket_authorizer_enabled === true, "edge_identity_realtime.ws_ticket_authorizer_enabled must be true");
}

function assertRagRuntime(section) {
  assertSectionStatus(section, "rag_runtime", "passed");
  assertFinalText(section.bedrock_knowledge_base_id, "rag_runtime.bedrock_knowledge_base_id");
  assertFinalText(section.s3_vector_bucket_name, "rag_runtime.s3_vector_bucket_name");
  assertFinalText(section.s3_vector_index_name, "rag_runtime.s3_vector_index_name");
  assertArn(section.agentcore_runtime_arn, "rag_runtime.agentcore_runtime_arn", "bedrock-agentcore");
  assert(section.tools_gateway_authorized === true, "rag_runtime.tools_gateway_authorized must be true");
  assert(section.acl_precheck_enabled === true, "rag_runtime.acl_precheck_enabled must be true");
}

function assertPublishedArtifacts(section) {
  assertSectionStatus(section, "published_artifacts", "published");
  assertAdminArtifactUrl(section.docusaurus_latest_url, "published_artifacts.docusaurus_latest_url", "/admin/docs/latest/");
  assertAdminArtifactUrl(section.docusaurus_version_url, "published_artifacts.docusaurus_version_url", "/admin/docs/versions/");
  assertAdminArtifactUrl(section.allure_latest_url, "published_artifacts.allure_latest_url", "/admin/test-reports/allure/latest/");
}

function assertDevUatValidation(section) {
  assertSectionStatus(section, "dev_uat_validation", "ready");
  assert(section.e2e_command === "npm run test:e2e:aws", "dev_uat_validation.e2e_command mismatch");
  assert(section.performance_command === "npm run perf:aws", "dev_uat_validation.performance_command mismatch");
  assert(section.rag_quality_command === "npm run rag:quality:aws", "dev_uat_validation.rag_quality_command mismatch");
  assert(section.requires_real_aws_execution === true, "dev_uat_validation.requires_real_aws_execution must be true");
}

function assertSectionStatus(section, name, expected) {
  assert(section && typeof section === "object", `${name} section is required`);
  assert(section.status === expected, `${name}.status must be ${expected}`);
}

function assertFinalText(value, label) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} is required`);
  assert(!/(^|[-_:/\s])(pending|placeholder|todo|tbd|dummy|mock|localhost|127\.0\.0\.1|0\.0\.0\.0)([-_:/\s]|$)/i.test(value), `${label} must not be placeholder/local text`);
}

function assertHttpsUrl(value, label) {
  assertFinalText(value, label);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  assert(url.protocol === "https:", `${label} must use https`);
  assertPublicHostname(url.hostname, label);
}

function assertWssUrl(value, label) {
  assertFinalText(value, label);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  assert(url.protocol === "wss:", `${label} must use wss`);
  assertPublicHostname(url.hostname, label);
}

function assertAdminArtifactUrl(value, label, pathPrefix) {
  assertHttpsUrl(value, label);
  const url = new URL(value);
  assert(url.pathname.startsWith(pathPrefix), `${label} must start with ${pathPrefix}`);
}

function assertArn(value, label, service) {
  assertFinalText(value, label);
  assert(value.startsWith(`arn:aws:${service}:`), `${label} must be an arn:aws:${service} ARN`);
}

function assertDnsName(value, label) {
  assertFinalText(value, label);
  assert(/^[a-z0-9][a-z0-9.-]+[a-z0-9]$/i.test(value), `${label} must be a DNS name`);
  assert(!value.endsWith(".local") && !value.endsWith(".test") && !value.endsWith(".internal"), `${label} must not be local/internal DNS`);
}

function assertPublicHostname(hostname, label) {
  assert(!["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname), `${label} must not use local hostname`);
  assert(!hostname.endsWith(".local") && !hostname.endsWith(".test") && !hostname.endsWith(".internal"), `${label} must not use local/internal hostname`);
  assert(!/^10\./.test(hostname) && !/^192\.168\./.test(hostname) && !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname), `${label} must not use private IP hostname`);
}
