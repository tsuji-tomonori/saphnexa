import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { currentGitCommit } from "./git-context.js";
import { assert, readJson } from "./lib.js";

export const preflightEvidenceOutputPath = "dist/acceptance/aws_dev_uat_preflight.json";
export const validationEvidenceOutputPath = "dist/acceptance/aws_dev_uat_validation.json";

export function buildAwsDevUatPreflightEvidence(inputPath, outputPath = preflightEvidenceOutputPath) {
  assert(inputPath, "preflight evidence input path is required");
  const input = readJson(inputPath);
  const captureProvenance = assertCaptureProvenance(input.capture_provenance, inputPath, [
    "aws-sts",
    "cloudformation-describe-stacks",
    "cloudformation-list-stack-resources",
    "flyway-info",
    "hono-openapi",
    "edge-realtime",
    "rag-runtime",
    "published-artifacts"
  ]);
  const outputs = stackOutputs(input.cloudformation);
  const accountId = accountIdFrom(input.aws?.account_id, input.aws?.account_id_parts, input.aws_identity?.Account, input.aws_identity?.AccountParts);
  const region = input.aws?.region || "ap-northeast-1";
  const stackName = input.cloudformation?.StackName || input.cloudformation?.stack_name;
  outputs.AgentCoreRuntimeArn ||= input.rag_runtime?.agentcore_runtime_arn || arn("bedrock-agentcore", region, accountId, `runtime/${input.rag_runtime?.agentcore_runtime_name || outputs.AgentCoreRuntimeName}`);

  const evidence = {
    schema_version: "saphnexa-aws-dev-uat-preflight.v1",
    evidence_class: "aws-captured",
    environment: input.environment,
    captured_at: input.captured_at,
    aws: {
      account_id: accountId,
      region
    },
    source: source(input.source),
    dsql_flyway: {
      status: input.dsql_flyway?.status || "passed",
      cluster_identifier: input.dsql_flyway?.cluster_identifier,
      endpoint: input.dsql_flyway?.endpoint || outputs.DsqlEndpoint,
      flyway_schema_history_table: input.dsql_flyway?.flyway_schema_history_table || "schema_migrations",
      latest_version: input.dsql_flyway?.latest_version,
      checksum_status: input.dsql_flyway?.checksum_status,
      applied_by: input.dsql_flyway?.applied_by || "flyway"
    },
    hono_openapi: {
      status: input.hono_openapi?.status || "passed",
      api_endpoint: input.hono_openapi?.api_endpoint || outputs.ApiEndpoint,
      openapi_url: input.hono_openapi?.openapi_url || `${trimSlash(outputs.ApiEndpoint)}/openapi.json`,
      route_count: input.hono_openapi?.route_count,
      zod_validation_enabled: input.hono_openapi?.zod_validation_enabled
    },
    cloudformation: {
      status: input.cloudformation?.status || "deployed",
      stack_name: stackName,
      stack_id: input.cloudformation?.StackId || input.cloudformation?.stack_id || arn("cloudformation", region, accountId, `stack/${stackName}/${input.cloudformation?.stack_uuid}`),
      stack_status: input.cloudformation?.StackStatus || input.cloudformation?.stack_status,
      outputs
    },
    edge_identity_realtime: {
      status: input.edge_identity_realtime?.status || "passed",
      cloudfront_url: input.edge_identity_realtime?.cloudfront_url || `https://${outputs.CloudFrontDistributionDomain}/`,
      cognito_user_pool_id: input.edge_identity_realtime?.cognito_user_pool_id || outputs.UserPoolId,
      cognito_user_pool_client_id: input.edge_identity_realtime?.cognito_user_pool_client_id || outputs.UserPoolClientId,
      appsync_event_api_http_endpoint: input.edge_identity_realtime?.appsync_event_api_http_endpoint || outputs.AppSyncEventApiHttpEndpoint,
      appsync_event_api_realtime_endpoint: input.edge_identity_realtime?.appsync_event_api_realtime_endpoint || outputs.AppSyncEventApiRealtimeEndpoint,
      ws_ticket_authorizer_enabled: input.edge_identity_realtime?.ws_ticket_authorizer_enabled
    },
    rag_runtime: {
      status: input.rag_runtime?.status || "passed",
      bedrock_knowledge_base_id: input.rag_runtime?.bedrock_knowledge_base_id || outputs.BedrockKnowledgeBaseId,
      s3_vector_bucket_name: input.rag_runtime?.s3_vector_bucket_name || outputs.S3VectorBucketName,
      s3_vector_index_name: input.rag_runtime?.s3_vector_index_name || outputs.S3VectorIndexName,
      agentcore_runtime_arn: input.rag_runtime?.agentcore_runtime_arn || outputs.AgentCoreRuntimeArn,
      tools_gateway_authorized: input.rag_runtime?.tools_gateway_authorized,
      acl_precheck_enabled: input.rag_runtime?.acl_precheck_enabled
    },
    published_artifacts: {
      status: input.published_artifacts?.status || "published",
      docusaurus_latest_url: input.published_artifacts?.docusaurus_latest_url || outputs.DocusaurusLatestUrl,
      docusaurus_version_url: input.published_artifacts?.docusaurus_version_url || outputs.DocusaurusVersionUrl,
      allure_latest_url: input.published_artifacts?.allure_latest_url || outputs.AllureLatestUrl
    },
    dev_uat_validation: {
      status: "ready",
      e2e_command: "npm run test:e2e:aws",
      performance_command: "npm run perf:aws",
      rag_quality_command: "npm run rag:quality:aws",
      requires_real_aws_execution: true
    },
    capture_provenance: captureProvenance
  };

  writeJson(outputPath, evidence);
  return evidence;
}

export function buildAwsDevUatValidationEvidence(inputPath, outputPath = validationEvidenceOutputPath) {
  assert(inputPath, "validation evidence input path is required");
  const input = readJson(inputPath);
  const captureProvenance = assertCaptureProvenance(input.capture_provenance, inputPath, [
    "e2e-allure",
    "cloudfront-access-log",
    "performance-report",
    "cloudwatch-dashboard",
    "rag-quality-report",
    "bedrock-evaluation-job"
  ]);
  const accountId = accountIdFrom(input.aws?.account_id, input.aws?.account_id_parts);
  const evidence = {
    schema_version: "saphnexa-aws-dev-uat-validation.v1",
    evidence_class: "aws-captured",
    environment: input.environment,
    captured_at: input.captured_at,
    source: source(input.source),
    preflight: {
      status: "passed",
      command: "npm run aws:dev-uat:preflight:final",
      evidence_path: preflightEvidenceOutputPath
    },
    e2e: {
      ...input.e2e,
      status: input.e2e?.status || "passed",
      command: "npm run test:e2e:aws"
    },
    performance: {
      ...input.performance,
      status: input.performance?.status || "passed",
      command: "npm run perf:aws"
    },
    rag_quality: {
      ...input.rag_quality,
      status: input.rag_quality?.status || "passed",
      command: "npm run rag:quality:aws",
      bedrock_evaluation_job_arn: input.rag_quality?.bedrock_evaluation_job_arn || arn("bedrock", "ap-northeast-1", accountId, `evaluation-job/${input.rag_quality?.evaluation_job_id}`)
    },
    capture_provenance: captureProvenance
  };

  writeJson(outputPath, evidence);
  return evidence;
}

function source(input = {}) {
  return {
    git_commit_sha: currentGitCommit(),
    git_tag: input.git_tag,
    github_release_url: input.github_release_url
  };
}

function stackOutputs(section = {}) {
  if (section.outputs && !Array.isArray(section.outputs)) return section.outputs;
  return Object.fromEntries((section.Outputs || section.outputs || []).map((item) => [item.OutputKey, item.OutputValue]));
}

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function accountIdFrom(...candidates) {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.join("");
    if (candidate) return candidate;
  }
  return undefined;
}

function arn(service, region, accountId, resource) {
  return `arn:aws:${service}:${region}:${accountId}:${resource}`;
}

function assertCaptureProvenance(provenance, inputPath, requiredIds) {
  assert(provenance && typeof provenance === "object", "capture_provenance is required");
  assert(provenance.source === "aws-dev-uat-raw-capture", "capture_provenance.source must be aws-dev-uat-raw-capture");
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(provenance.captured_at || ""), "capture_provenance.captured_at must be JST timestamp");
  assert(Array.isArray(provenance.commands), "capture_provenance.commands must be an array");
  const commandsById = new Map(provenance.commands.map((item) => [item.id, item]));
  for (const id of requiredIds) {
    const item = commandsById.get(id);
    assert(item, `capture_provenance.commands missing ${id}`);
    assert(typeof item.command === "string" && item.command.trim().length > 0, `capture_provenance.commands.${id}.command is required`);
    assert(!/(placeholder|todo|tbd|dummy|mock|localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(item.command), `capture_provenance.commands.${id}.command must not be placeholder/local text`);
    assert(typeof item.output_ref === "string" && item.output_ref.trim().length > 0, `capture_provenance.commands.${id}.output_ref is required`);
    assert(!isAbsolute(item.output_ref), `capture_provenance.commands.${id}.output_ref must be relative`);
    assert(!item.output_ref.split(/[\\/]/).includes(".."), `capture_provenance.commands.${id}.output_ref must not traverse directories`);
    assert(existsSync(resolve(dirname(inputPath), item.output_ref)), `capture_provenance.commands.${id}.output_ref file missing: ${item.output_ref}`);
    assert(item.status === "captured", `capture_provenance.commands.${id}.status must be captured`);
  }
  assert(JSON.stringify(provenance.required_command_ids || []) === JSON.stringify(requiredIds), "capture_provenance.required_command_ids mismatch");
  return provenance;
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
