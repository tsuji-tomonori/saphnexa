import {
  awsDevUatExecutionBridgePath,
  buildAwsDevUatExecutionBridge,
  expectedAwsDevUatFinalCommandOrder
} from "./aws-dev-uat-execution-bridge.js";
import { assert } from "./lib.js";

const args = new Set(process.argv.slice(2));
const bridge = buildAwsDevUatExecutionBridge(awsDevUatExecutionBridgePath, {
  probeAwsIdentity: args.has("--probe-aws-identity")
});

assert(bridge.schema_version === "saphnexa-aws-dev-uat-execution-bridge.v1", "execution bridge schema mismatch");
assert(/^[a-f0-9]{40}$/.test(bridge.source.git_commit_sha), "execution bridge source git SHA mismatch");
assert(
  JSON.stringify(bridge.command_order) === JSON.stringify(expectedAwsDevUatFinalCommandOrder()),
  "AWS dev/UAT final command order mismatch"
);
assert(bridge.aws_identity.command === "aws sts get-caller-identity --output json", "AWS identity probe command mismatch");
assert(
  ["not_probed", "authenticated", "missing_cli", "missing_credentials", "probe_failed"].includes(bridge.aws_identity.status),
  "AWS identity status mismatch"
);

const preflight = bridge.final_evidence.find((item) => item.id === "preflight");
const validation = bridge.final_evidence.find((item) => item.id === "validation");
assert(preflight?.path === "dist/acceptance/aws_dev_uat_preflight.json", "preflight evidence path mismatch");
assert(validation?.path === "dist/acceptance/aws_dev_uat_validation.json", "validation evidence path mismatch");
assert(preflight.final_command === "npm run aws:dev-uat:preflight:final", "preflight final command mismatch");
assert(validation.final_command === "npm run aws:dev-uat:validation:final", "validation final command mismatch");
for (const item of bridge.final_evidence) {
  assert(item.evidence_class_required === "aws-captured", `${item.id} evidence class requirement mismatch`);
}

const expectedBlockers = [];
if (bridge.aws_identity.status !== "authenticated") expectedBlockers.push(`aws_identity_${bridge.aws_identity.status}`);
for (const item of bridge.final_evidence) {
  if (!item.exists) expectedBlockers.push(`missing_${item.id}_evidence`);
}
assert(
  JSON.stringify(bridge.readiness.blockers) === JSON.stringify(expectedBlockers),
  "execution bridge blockers must reflect AWS identity and evidence file state"
);
assert(
  bridge.readiness.ready_to_run_final_gates === (expectedBlockers.length === 0),
  "execution bridge readiness mismatch"
);
assert(bridge.required_inputs.aws_region === "ap-northeast-1", "AWS region requirement mismatch");
assert(bridge.required_inputs.datasets.includes("golden-v0.17"), "golden dataset requirement mismatch");
assert(bridge.evidence_mapping.preflight.cloudformation_outputs.includes("describe-stacks"), "CloudFormation mapping mismatch");
assert(bridge.evidence_mapping.validation.rag_quality.includes("Bedrock evaluation"), "RAG quality mapping mismatch");
assert(bridge.note.includes("does not deploy"), "execution bridge must state it does not change external state");

if (args.has("--require-ready")) {
  assert(bridge.readiness.ready_to_run_final_gates === true, `AWS dev/UAT final gates are not ready: ${bridge.readiness.blockers.join(", ")}`);
}

console.log(
  `AWS dev/UAT execution bridge check passed: ${awsDevUatExecutionBridgePath} (${bridge.readiness.status})`
);
