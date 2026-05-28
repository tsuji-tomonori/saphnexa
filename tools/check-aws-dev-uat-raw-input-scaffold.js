import { isAbsolute } from "node:path";
import { validateRawCapturePlan } from "./check-aws-dev-uat-raw-capture-plan.js";
import {
  preflightCaptureCommandIds,
  validationCaptureCommandIds
} from "./aws-dev-uat-evidence-builders.js";
import { rawCapturePlanOutputPath } from "./aws-dev-uat-raw-capture-plan.js";
import {
  preflightRawInputScaffoldPath,
  validationRawInputScaffoldPath
} from "./aws-dev-uat-raw-input-scaffold.js";
import { assert, isCurrentJstTimestamp, readJson } from "./lib.js";

const plan = readJson(rawCapturePlanOutputPath);
validateRawCapturePlan(plan);

validateScaffold(readJson(preflightRawInputScaffoldPath), {
  label: "preflight",
  planMode: plan.modes.preflight,
  expectedCommandIds: preflightCaptureCommandIds
});
validateScaffold(readJson(validationRawInputScaffoldPath), {
  label: "validation",
  planMode: plan.modes.validation,
  expectedCommandIds: validationCaptureCommandIds
});

console.log("AWS dev/UAT raw input scaffold check passed");

function validateScaffold(scaffold, context) {
  assert(scaffold.schema_version === "saphnexa-aws-dev-uat-raw-input-scaffold.v1", `${context.label} scaffold schema mismatch`);
  assert(scaffold.mode === context.label, `${context.label} scaffold mode mismatch`);
  assert(isCurrentJstTimestamp(scaffold.generated_at), `${context.label} scaffold generated_at must be current JST timestamp`);
  assert(scaffold.scaffold_status === "requires_operator_values", `${context.label} scaffold status mismatch`);
  assert(scaffold.final_evidence === false, `${context.label} scaffold must not be final evidence`);
  assert(scaffold.captured_at === null, `${context.label} scaffold captured_at must remain null`);
  assert(scaffold.aws?.region === "ap-northeast-1", `${context.label} scaffold region mismatch`);
  assert(scaffold.capture_provenance?.source === "aws-dev-uat-raw-capture", `${context.label} capture source mismatch`);
  assert(scaffold.capture_provenance?.captured_at === null, `${context.label} capture timestamp must remain null`);
  assert(isCurrentJstTimestamp(scaffold.capture_provenance?.scaffold_generated_at), `${context.label} scaffold provenance timestamp mismatch`);
  assert(
    JSON.stringify(scaffold.capture_provenance?.required_command_ids || []) === JSON.stringify(context.expectedCommandIds),
    `${context.label} required command ids mismatch`
  );
  assert(
    JSON.stringify(scaffold.capture_provenance.commands.map((item) => item.id)) === JSON.stringify(context.planMode.commands.map((item) => item.id)),
    `${context.label} command ids must match raw capture plan`
  );

  for (const [index, command] of scaffold.capture_provenance.commands.entries()) {
    const planned = context.planMode.commands[index];
    assert(command.command === planned.command, `${context.label}.${command.id}.command must match raw capture plan`);
    assert(command.output_ref === planned.output_ref, `${context.label}.${command.id}.output_ref must match raw capture plan`);
    assert(command.output_kind === planned.output_kind, `${context.label}.${command.id}.output_kind must match raw capture plan`);
    assert(command.status === "pending_capture", `${context.label}.${command.id}.status must remain pending_capture`);
    assert(command.status_after_capture === "captured", `${context.label}.${command.id}.status_after_capture mismatch`);
    assert(!/(placeholder|todo|tbd|dummy|mock|localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(command.command), `${context.label}.${command.id}.command must not be placeholder/local text`);
    assert(typeof command.output_ref === "string" && command.output_ref.startsWith("raw/"), `${context.label}.${command.id}.output_ref must stay under raw/`);
    assert(!isAbsolute(command.output_ref), `${context.label}.${command.id}.output_ref must be relative`);
    assert(!command.output_ref.split(/[\\/]/).includes(".."), `${context.label}.${command.id}.output_ref must not traverse directories`);
  }

  assert(Array.isArray(scaffold.operator_notes) && scaffold.operator_notes.some((item) => item.includes("Do not use this scaffold itself as final evidence")), `${context.label} scaffold must warn against final evidence use`);
}
