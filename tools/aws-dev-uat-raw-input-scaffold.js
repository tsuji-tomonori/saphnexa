import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildAwsDevUatRawCapturePlan } from "./aws-dev-uat-raw-capture-plan.js";
import { currentJstTimestamp } from "./lib.js";

export const preflightRawInputScaffoldPath = "dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json";
export const validationRawInputScaffoldPath = "dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json";

export function buildAwsDevUatRawInputScaffolds(options = {}) {
  const environment = options.environment || "uat";
  const plan = buildAwsDevUatRawCapturePlan({
    environment,
    region: options.region,
    stackName: options.stackName,
    runId: options.runId,
    captureRoot: options.captureRoot,
    outputPath: options.planOutputPath
  });
  const generatedAt = currentJstTimestamp();
  const preflight = preflightScaffold(plan, generatedAt);
  const validation = validationScaffold(plan, generatedAt);
  const preflightPath = options.preflightOutputPath || preflightRawInputScaffoldPath;
  const validationPath = options.validationOutputPath || validationRawInputScaffoldPath;

  writeJson(preflightPath, preflight);
  writeJson(validationPath, validation);

  return {
    preflight_path: preflightPath,
    validation_path: validationPath,
    preflight,
    validation
  };
}

function preflightScaffold(plan, generatedAt) {
  return {
    schema_version: "saphnexa-aws-dev-uat-raw-input-scaffold.v1",
    mode: "preflight",
    generated_at: generatedAt,
    scaffold_status: "requires_operator_values",
    final_evidence: false,
    environment: plan.environment,
    captured_at: null,
    aws: {
      region: plan.region,
      account_id: null
    },
    source: {
      git_tag: null,
      github_release_url: null
    },
    cloudformation: {
      stack_name: plan.stack_name,
      stack_id: null,
      stack_status: null,
      outputs: {}
    },
    dsql_flyway: {
      status: null,
      cluster_identifier: null,
      endpoint: null,
      latest_version: null,
      checksum_status: null
    },
    hono_openapi: {
      status: null,
      api_endpoint: null,
      openapi_url: null,
      route_count: null,
      zod_validation_enabled: null
    },
    edge_identity_realtime: {
      status: null,
      cloudfront_url: null,
      cognito_user_pool_id: null,
      cognito_user_pool_client_id: null,
      appsync_event_api_http_endpoint: null,
      appsync_event_api_realtime_endpoint: null,
      ws_ticket_authorizer_enabled: null
    },
    rag_runtime: {
      status: null,
      bedrock_knowledge_base_id: null,
      s3_vector_bucket_name: null,
      s3_vector_index_name: null,
      agentcore_runtime_arn: null,
      tools_gateway_authorized: null,
      acl_precheck_enabled: null
    },
    published_artifacts: {
      status: null,
      docusaurus_latest_url: null,
      docusaurus_version_url: null,
      allure_latest_url: null
    },
    materialization: {
      status: "pending_materialization",
      raw_input_scaffold_path: plan.modes.preflight.raw_input_scaffold_path,
      raw_input_path: plan.modes.preflight.raw_input_path,
      command: plan.modes.preflight.materialize_command
    },
    capture_provenance: provenance(plan.modes.preflight, generatedAt),
    operator_notes: [
      "Capture real AWS dev/UAT preflight raw output files first.",
      "Run materialization.command to generate the final preflight raw input from this scaffold and the captured raw output files.",
      "Set captured_at and capture_provenance.captured_at to the actual JST capture timestamp.",
      "Change every capture_provenance.commands[].status to captured only after the referenced output_ref file exists.",
      "Do not use this scaffold itself as final evidence."
    ]
  };
}

function validationScaffold(plan, generatedAt) {
  return {
    schema_version: "saphnexa-aws-dev-uat-raw-input-scaffold.v1",
    mode: "validation",
    generated_at: generatedAt,
    scaffold_status: "requires_operator_values",
    final_evidence: false,
    environment: plan.environment,
    captured_at: null,
    aws: {
      region: plan.region,
      account_id: null
    },
    source: {
      git_tag: null,
      github_release_url: null
    },
    e2e: {
      status: null,
      passed_flows: null,
      total_flows: null,
      allure_run_url: null,
      cloudfront_access_log_ref: null
    },
    performance: {
      status: null,
      non_ai_api_p95_ms: null,
      error_rate: null,
      question_start_p95_ms: null,
      rag_first_notice_p95_ms: null,
      final_answer_p95_ms: null,
      timeout_rate: null,
      report_url: null
    },
    rag_quality: {
      status: null,
      golden_dataset: null,
      evaluation_job_id: null,
      bedrock_evaluation_job_arn: null,
      recall_at_10: null,
      citation_precision: null,
      groundedness: null,
      refusal_accuracy: null,
      unsupported_claim_rate: null,
      report_url: null
    },
    materialization: {
      status: "pending_materialization",
      raw_input_scaffold_path: plan.modes.validation.raw_input_scaffold_path,
      raw_input_path: plan.modes.validation.raw_input_path,
      command: plan.modes.validation.materialize_command
    },
    capture_provenance: provenance(plan.modes.validation, generatedAt),
    operator_notes: [
      "Capture real AWS dev/UAT E2E, performance, and RAG quality raw output files first.",
      "Run materialization.command to generate the final validation raw input from this scaffold and the captured raw output files.",
      "Set captured_at and capture_provenance.captured_at to the actual JST capture timestamp.",
      "Change every capture_provenance.commands[].status to captured only after the referenced output_ref file exists.",
      "Do not use this scaffold itself as final evidence."
    ]
  };
}

function provenance(mode, generatedAt) {
  return {
    source: "aws-dev-uat-raw-capture",
    scaffold_generated_at: generatedAt,
    captured_at: null,
    required_command_ids: mode.required_command_ids,
    commands: mode.commands.map((item) => ({
      id: item.id,
      command: item.command,
      output_ref: item.output_ref,
      output_kind: item.output_kind,
      status: "pending_capture",
      status_after_capture: item.status_after_capture
    }))
  };
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
