import { existsSync } from "node:fs";
import { cloudFormationInventoryPath, expectedMajorResourceTypes } from "./cloudformation-inventory.js";
import { assert, readJson } from "./lib.js";

assert(existsSync("docs/acceptance/cloudformation/cloudformation_inventory.schema.json"), "CloudFormation inventory schema missing");
assert(existsSync(cloudFormationInventoryPath), `CloudFormation inventory draft missing: ${cloudFormationInventoryPath}`);

const schema = readJson("docs/acceptance/cloudformation/cloudformation_inventory.schema.json");
const inventory = readJson(cloudFormationInventoryPath);

assert(schema.title === "Saphnexa CloudFormation Inventory", "CloudFormation inventory schema title mismatch");
const commonRequired = [
  "schema_version",
  "system",
  "environment",
  "aws_region",
  "stack_name",
  "source",
  "final_acceptance_eligible",
  "aws_capture_required"
];
for (const key of commonRequired) {
  assert(schema.required.includes(key), `CloudFormation inventory schema common required missing ${key}`);
}
for (const draftOnlyKey of ["local_cdk_inventory", "expected_major_resource_types", "final_capture_instructions"]) {
  assert(!schema.required.includes(draftOnlyKey), `CloudFormation inventory schema must not require draft-only field globally: ${draftOnlyKey}`);
}
const localSourceCondition = sourceCondition(schema, "local-cdk-intent");
const awsSourceCondition = sourceCondition(schema, "aws-cloudformation-inventory");
for (const key of ["local_cdk_inventory", "expected_major_resource_types", "final_capture_instructions"]) {
  assert(localSourceCondition.then.required.includes(key), `local-cdk-intent schema condition missing required ${key}`);
}
for (const key of ["stack_id", "stack_status", "stack_outputs", "stack_resources"]) {
  assert(awsSourceCondition.then.required.includes(key), `aws-cloudformation-inventory schema condition missing required ${key}`);
}
assert(schema.properties.stack_outputs.minItems === 1, "CloudFormation inventory schema must require non-empty stack_outputs");
assert(schema.properties.stack_resources.minItems === 1, "CloudFormation inventory schema must require non-empty stack_resources");
assert(schema.properties.stack_status.enum.includes("UPDATE_COMPLETE"), "CloudFormation inventory schema must include complete stack statuses");
assert(localSourceCondition.then.properties.final_acceptance_eligible.const === false, "local source schema must not be final acceptance eligible");
assert(localSourceCondition.then.properties.aws_capture_required.const === true, "local source schema must require AWS capture");
assert(awsSourceCondition.then.properties.final_acceptance_eligible.const === true, "AWS source schema must be final acceptance eligible");
assert(awsSourceCondition.then.properties.aws_capture_required.const === false, "AWS source schema must not require more AWS capture");
for (const key of ["schema_version", "system", "environment", "aws_region", "stack_name", "source", "final_acceptance_eligible", "aws_capture_required", "local_cdk_inventory", "expected_major_resource_types", "final_capture_instructions"]) {
  assert(Object.prototype.hasOwnProperty.call(inventory, key), `CloudFormation inventory missing ${key}`);
}

assert(inventory.schema_version === "saphnexa-cloudformation-inventory.v1", "CloudFormation inventory schema version mismatch");
assert(inventory.system === "Saphnexa", "CloudFormation inventory system mismatch");
assert(inventory.environment === "uat", "CloudFormation inventory environment mismatch");
assert(inventory.aws_region === "ap-northeast-1", "CloudFormation inventory region mismatch");
assert(inventory.source === "local-cdk-intent", "draft inventory must come from local CDK intent");
assert(inventory.final_acceptance_eligible === false, "draft inventory must not be final acceptance eligible");
assert(inventory.aws_capture_required === true, "draft inventory must require AWS capture");
assert(inventory.local_cdk_inventory.construct_count === 7, "CloudFormation inventory construct count mismatch");
assert(/^sha256:[a-f0-9]{64}$/.test(inventory.local_cdk_inventory.checksum), "CloudFormation inventory checksum format mismatch");

for (const construct of inventory.local_cdk_inventory.constructs) {
  assert(construct.name.endsWith("Construct"), `invalid construct name: ${construct.name}`);
  assert(construct.resource_count === construct.resources.length, `resource count mismatch: ${construct.name}`);
  assert(construct.output_count === construct.outputs.length, `output count mismatch: ${construct.name}`);
  assert(construct.resource_count > 0, `missing resources: ${construct.name}`);
  assert(construct.output_count > 0, `missing outputs: ${construct.name}`);
}

for (const type of expectedMajorResourceTypes) {
  assert(inventory.expected_major_resource_types.includes(type), `missing expected resource type: ${type}`);
}

assert(inventory.final_capture_instructions.describe_stacks_command.includes("describe-stacks"), "missing describe-stacks instruction");
assert(inventory.final_capture_instructions.list_stack_resources_command.includes("list-stack-resources"), "missing list-stack-resources instruction");
assert(inventory.final_capture_instructions.normalized_final_inventory_path === "docs/acceptance/cloudformation/cloudformation_inventory.uat.json", "final inventory path mismatch");
assert(inventory.note.includes("must not be used as final AC-081 proof"), "draft limitation note missing");

console.log("CloudFormation inventory check passed");

function sourceCondition(schemaDocument, source) {
  const match = (schemaDocument.allOf || []).find((item) => item.if?.properties?.source?.const === source);
  assert(Boolean(match), `CloudFormation inventory schema missing ${source} source condition`);
  assert(Array.isArray(match.then?.required), `CloudFormation inventory schema ${source} condition missing then.required`);
  return match;
}
