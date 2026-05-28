import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { readJson } from "./lib.js";
import { assert } from "./aws-dev-uat-capture-helper-lib.js";

export function buildAwsDevUatValidationRawInput(options = {}) {
  const required = ["scaffoldPath", "outputPath", "capturedAt", "gitTag", "githubReleaseUrl", "awsAccountId"];
  for (const key of required) assert(options[key], `${key} is required`);

  const scaffold = readJson(options.scaffoldPath);
  assert(scaffold.schema_version === "saphnexa-aws-dev-uat-raw-input-scaffold.v1", "validation scaffold schema mismatch");
  assert(scaffold.mode === "validation", "validation scaffold mode mismatch");
  assertTimestamp(options.capturedAt, "capturedAt");
  assert(/^\d{12}$/.test(options.awsAccountId), "awsAccountId must be a 12 digit AWS account id");

  const commands = scaffold.capture_provenance?.commands || [];
  const e2e = readOutput(options.scaffoldPath, commands, "e2e-allure");
  const performance = readOutput(options.scaffoldPath, commands, "performance-report");
  const ragQuality = readOutput(options.scaffoldPath, commands, "rag-quality-report");
  readTextOutput(options.scaffoldPath, commands, "cloudfront-access-log");
  readOutput(options.scaffoldPath, commands, "cloudwatch-dashboard");
  readOutput(options.scaffoldPath, commands, "bedrock-evaluation-job");

  assert(e2e.schema_version === "saphnexa-aws-dev-uat-e2e-result.raw.v1", "E2E raw output schema mismatch");
  assert(performance.schema_version === "saphnexa-aws-dev-uat-performance-result.raw.v1", "performance raw output schema mismatch");
  assert(ragQuality.schema_version === "saphnexa-aws-dev-uat-rag-quality-result.raw.v1", "RAG quality raw output schema mismatch");
  assert(e2e.status === "captured", "E2E raw output must be captured");
  assert(performance.status === "captured", "performance raw output must be captured");
  assert(ragQuality.status === "captured", "RAG quality raw output must be captured");
  assert(e2e.passed_flows === e2e.total_flows, "E2E raw output must have all flows passed");
  assert(performance.non_ai_api_p95_ms <= 800, "performance non-AI API p95 must be <= 800ms");
  assert(ragQuality.recall_at_10 >= 0.85, "RAG recall@10 must be >= 0.85");

  const rawInput = {
    environment: scaffold.environment,
    captured_at: options.capturedAt,
    source: {
      git_tag: options.gitTag,
      github_release_url: options.githubReleaseUrl
    },
    aws: {
      account_id: options.awsAccountId
    },
    capture_provenance: {
      source: "aws-dev-uat-raw-capture",
      captured_at: options.capturedAt,
      required_command_ids: scaffold.capture_provenance.required_command_ids,
      commands: commands.map((item) => ({
        id: item.id,
        command: item.command,
        output_ref: item.output_ref,
        status: "captured"
      }))
    },
    e2e: {
      scenario_count: e2e.total_flows,
      passed_count: e2e.passed_flows,
      failed_count: 0,
      pass_rate: e2e.pass_rate,
      allure_report_url: e2e.allure_run_url,
      cloudfront_access_log_s3_uri: e2e.cloudfront_access_log_s3_uri,
      scenarios: e2e.scenarios
    },
    performance: {
      load_profile: performance.load_profile,
      report_url: performance.report_url,
      cloudwatch_dashboard_url: performance.cloudwatch_dashboard_url,
      metrics: {
        non_ai_api_p95_ms: performance.non_ai_api_p95_ms,
        non_ai_api_error_rate: performance.error_rate,
        question_start_p95_ms: performance.question_start_p95_ms,
        rag_first_notification_p95_ms: performance.rag_first_notice_p95_ms,
        rag_final_answer_p95_ms: performance.final_answer_p95_ms,
        rag_timeout_rate: performance.timeout_rate
      }
    },
    rag_quality: {
      dataset_id: ragQuality.golden_dataset,
      evaluation_run_id: ragQuality.evaluation_job_id,
      report_url: ragQuality.report_url,
      evaluation_job_id: ragQuality.evaluation_job_id,
      bedrock_evaluation_job_arn: ragQuality.bedrock_evaluation_job_arn,
      metric_categories: ["retrieval", "generation", "end_to_end"],
      metrics: {
        recall_at_10: ragQuality.recall_at_10,
        citation_precision: ragQuality.citation_precision,
        groundedness: ragQuality.groundedness,
        refusal_accuracy: ragQuality.refusal_accuracy,
        unsupported_claim_rate: ragQuality.unsupported_claim_rate
      }
    }
  };

  writeJson(options.outputPath, rawInput);
  return rawInput;
}

export function cli(argv = process.argv.slice(2)) {
  const options = {
    scaffoldPath: valueFor(argv, "--scaffold"),
    outputPath: valueFor(argv, "--output"),
    capturedAt: valueFor(argv, "--captured-at"),
    gitTag: valueFor(argv, "--git-tag"),
    githubReleaseUrl: valueFor(argv, "--github-release-url"),
    awsAccountId: valueFor(argv, "--aws-account-id")
  };
  if (argv.includes("--help") || !options.scaffoldPath || !options.outputPath) {
    console.error("Usage: node tools/build-aws-dev-uat-validation-raw-input.js --scaffold <validation-scaffold.json> --output <validation-raw-input.json> --captured-at <JST timestamp> --git-tag <tag> --github-release-url <url> --aws-account-id <12-digit-id>");
    process.exit(argv.includes("--help") ? 0 : 1);
  }
  buildAwsDevUatValidationRawInput(options);
  console.log(`AWS dev/UAT validation raw input generated: ${options.outputPath}`);
}

function readOutput(scaffoldPath, commands, id) {
  return readJson(outputPathFor(scaffoldPath, commands, id));
}

function readTextOutput(scaffoldPath, commands, id) {
  const path = outputPathFor(scaffoldPath, commands, id);
  assert(existsSync(path), `${id} raw output missing: ${path}`);
  return path;
}

function outputPathFor(scaffoldPath, commands, id) {
  const command = commands.find((item) => item.id === id);
  assert(command, `validation scaffold missing command ${id}`);
  assert(command.output_ref && !command.output_ref.split(/[\\/]/).includes(".."), `${id}.output_ref must stay under scaffold directory`);
  const path = resolve(dirname(scaffoldPath), command.output_ref);
  assert(existsSync(path), `${id} raw output missing: ${command.output_ref}`);
  return path;
}

function assertTimestamp(value, label) {
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(value), `${label} must be a JST timestamp`);
}

function valueFor(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] || null;
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
