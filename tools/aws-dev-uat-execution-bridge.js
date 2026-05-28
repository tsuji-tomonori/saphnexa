import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { currentGitCommit } from "./git-context.js";
import { currentJstTimestamp } from "./lib.js";

export const awsDevUatExecutionBridgePath = "dist/acceptance/aws_dev_uat_execution_bridge.json";

const preflightEvidencePath = "dist/acceptance/aws_dev_uat_preflight.json";
const validationEvidencePath = "dist/acceptance/aws_dev_uat_validation.json";

const finalCommandOrder = [
  "npm run aws:dev-uat:execution-bridge:probe",
  "npm run aws:dev-uat:preflight:final",
  "npm run test:e2e:aws",
  "npm run perf:aws",
  "npm run rag:quality:aws",
  "npm run aws:dev-uat:validation:final"
];

export function buildAwsDevUatExecutionBridge(outputPath = awsDevUatExecutionBridgePath, options = {}) {
  const evidence = [
    evidenceState({
      id: "preflight",
      path: preflightEvidencePath,
      final_command: "npm run aws:dev-uat:preflight:final",
      required_before: ["AWS deploy/publish/migration complete", "CloudFormation outputs captured"]
    }),
    evidenceState({
      id: "validation",
      path: validationEvidencePath,
      final_command: "npm run aws:dev-uat:validation:final",
      required_before: ["preflight final gate passed", "AWS E2E/performance/RAG quality runs complete"]
    })
  ];

  const awsIdentity = options.probeAwsIdentity ? probeAwsIdentity() : {
    status: "not_probed",
    command: "aws sts get-caller-identity --output json",
    reason: "Run npm run aws:dev-uat:execution-bridge:probe to verify local AWS credentials without changing AWS state."
  };

  const blockers = [];
  if (awsIdentity.status !== "authenticated") blockers.push(`aws_identity_${awsIdentity.status}`);
  for (const item of evidence) {
    if (!item.exists) blockers.push(`missing_${item.id}_evidence`);
  }

  const bridge = {
    schema_version: "saphnexa-aws-dev-uat-execution-bridge.v1",
    generated_at: currentJstTimestamp(),
    generated_by: "tools/check-aws-dev-uat-execution-bridge.js",
    source: {
      git_commit_sha: currentGitCommit()
    },
    readiness: {
      ready_to_run_final_gates: blockers.length === 0,
      status: blockers.length === 0 ? "ready_to_run_final_gates" : "waiting_for_external_execution",
      blockers
    },
    aws_identity: awsIdentity,
    final_evidence: evidence,
    command_order: finalCommandOrder,
    required_inputs: {
      environment: ["dev", "uat"],
      aws_region: "ap-northeast-1",
      stack_name: "saphnexa-<dev|uat>",
      release: ["git_tag", "github_release_url"],
      test_identities: ["general_user", "admin"],
      datasets: ["golden-v0.17"],
      approval_required_for: ["cdk deploy", "flyway apply", "s3 publish", "load test", "Bedrock evaluation"]
    },
    evidence_mapping: {
      preflight: {
        aws_account: "aws sts get-caller-identity",
        cloudformation_outputs: "aws cloudformation describe-stacks",
        cloudformation_resources: "aws cloudformation list-stack-resources",
        dsql_flyway: "Flyway schema history on Aurora DSQL",
        hono_openapi: "deployed API /openapi.json",
        edge_identity_realtime: "CloudFront, Cognito, AppSync Events endpoints",
        rag_runtime: "Bedrock KB, S3 Vectors, AgentCore runtime IDs",
        published_artifacts: "CloudFront admin docs and Allure URLs"
      },
      validation: {
        e2e: "Allure run for the six required AWS dev/UAT scenarios",
        performance: "AWS load test report and CloudWatch dashboard",
        rag_quality: "Bedrock evaluation job and golden-v0.17 quality report"
      }
    },
    note: "This bridge does not deploy, migrate, publish, run load tests, or invoke Bedrock evaluations. It only records whether local prerequisites exist before running the final evidence gates."
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(bridge, null, 2)}\n`);
  return bridge;
}

export function expectedAwsDevUatFinalCommandOrder() {
  return [...finalCommandOrder];
}

function evidenceState(item) {
  return {
    ...item,
    exists: existsSync(item.path),
    evidence_class_required: "aws-captured"
  };
}

function probeAwsIdentity() {
  const command = "aws sts get-caller-identity --output json";
  const result = spawnSync("aws", ["sts", "get-caller-identity", "--output", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10000
  });

  if (result.error?.code === "ENOENT") {
    return {
      status: "missing_cli",
      command,
      reason: "AWS CLI is not installed or is not on PATH."
    };
  }
  if (result.error) {
    return {
      status: "probe_failed",
      command,
      reason: result.error.message
    };
  }
  if (result.status !== 0) {
    return {
      status: stderrLooksLikeMissingCredentials(result.stderr) ? "missing_credentials" : "probe_failed",
      command,
      reason: compact(result.stderr || result.stdout || `aws exited with status ${result.status}`)
    };
  }

  let identity;
  try {
    identity = JSON.parse(result.stdout);
  } catch {
    return {
      status: "probe_failed",
      command,
      reason: "aws sts get-caller-identity did not return JSON."
    };
  }

  return {
    status: "authenticated",
    command,
    account_id: identity.Account,
    user_id: identity.UserId,
    arn: identity.Arn
  };
}

function stderrLooksLikeMissingCredentials(stderr) {
  return /Unable to locate credentials|could not be found|NoCredentialProviders|ExpiredToken|InvalidClientTokenId/i.test(stderr || "");
}

function compact(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
