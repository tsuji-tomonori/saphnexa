import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createLocalApi } from "../apps/api/src/local-api.js";
import { adminArtifactPublishBindings } from "../infra/cdk/admin-artifact-publish-bindings.js";
import { assert, isCurrentJstTimestamp, readJson } from "./lib.js";

const docsManifest = readJson("dist/admin/docs/manifest.json");
assert(docsManifest.schema_version === "admin-docs-artifact.v1", "docs manifest schema mismatch");
assert(docsManifest.generator === "docusaurus", "docs manifest generator mismatch");
assert(docsManifest.latest_version === "v0.17", "docs manifest latest version mismatch");
assert(JSON.stringify(docsManifest.versions) === JSON.stringify(["v0.16", "v0.17"]), "docs manifest versions mismatch");
assert(docsManifest.docusaurus_config_path === adminArtifactPublishBindings.docusaurus.configPath, "docs manifest Docusaurus config mismatch");
assert(docsManifest.cloudfront_signed_cookie_required === true, "docs manifest must require CloudFront signed cookie");
assert(docsManifest.final_publish_status === "pending_external", "docs manifest final publish status mismatch");
assert(docsManifest.artifacts.length === 3, "docs manifest must include latest and version artifacts");
assertArtifact(docsManifest.artifacts[0], "/admin/docs/latest/");
assertArtifact(docsManifest.artifacts[1], "/admin/docs/versions/v0.16/");
assertArtifact(docsManifest.artifacts[2], "/admin/docs/versions/v0.17/");
for (const source of ["docs/acceptance/traceability.md", "docs/adr/ADR-0001-local-first-acceptance-slice.md", "docs/ops/runbooks/incident-response.md"]) {
  assert(docsManifest.artifacts.every((artifact) => artifact.source_files.includes(source)), `docs manifest missing source ${source}`);
}
for (const artifact of docsManifest.artifacts) {
  assert(artifact.generator === "docusaurus", `docs artifact generator mismatch: ${artifact.viewer_path}`);
  assert(artifact.docusaurus_build_command === adminArtifactPublishBindings.docusaurus.buildCommand, `docs artifact build command mismatch: ${artifact.viewer_path}`);
  assert(artifact.publish_candidate_command.startsWith("aws s3 sync dist/admin/docs/"), `docs artifact publish command mismatch: ${artifact.viewer_path}`);
  assert(artifact.s3_prefix.startsWith("docs-site/"), `docs artifact s3 prefix mismatch: ${artifact.viewer_path}`);
}

const reportManifest = readJson("dist/admin/test-reports/allure/latest/manifest.json");
assert(reportManifest.schema_version === "admin-test-report-artifact.v1", "test report manifest schema mismatch");
assert(reportManifest.generator === "allure-commandline", "test report manifest generator mismatch");
assert(reportManifest.allure_generate_command.includes("allure generate"), "test report manifest must include Allure generate command");
assert(reportManifest.s3_prefix === adminArtifactPublishBindings.allure.latest.s3_prefix, "test report s3 prefix mismatch");
assert(reportManifest.run_s3_prefix_pattern === adminArtifactPublishBindings.allure.run.s3_prefix, "test report run s3 prefix mismatch");
assert(reportManifest.raw_results_s3_prefix_pattern === adminArtifactPublishBindings.allure.rawResults.s3_prefix_pattern, "test report raw results s3 prefix mismatch");
assert(reportManifest.cloudfront_signed_cookie_required === true, "test report manifest must require CloudFront signed cookie");
assert(reportManifest.final_publish_status === "pending_external", "test report final publish status mismatch");
assertArtifact(reportManifest, "/admin/test-reports/allure/latest/");
assert(isCurrentJstTimestamp(reportManifest.generated_at), "test report manifest generated_at must be current JST timestamp");
for (const suite of reportManifest.suites) {
  assert(suite.package_script_defined, `suite package script missing: ${suite.name}`);
  assert(suite.ci_workflow_references_command, `suite command missing from CI workflow: ${suite.command}`);
}

const api = createLocalApi();
const adminCsrf = api.request("admin-1", "getMe").body.csrf_token;
const userCsrf = api.request("user-owner", "getMe").body.csrf_token;
const adminList = api.request("admin-1", "listPublishedArtifacts");
assert(adminList.status === 200, "admin must list published artifacts");
for (const path of ["/admin/docs/latest/", "/admin/docs/versions/v0.16/", "/admin/docs/versions/v0.17/", "/admin/test-reports/allure/latest/"]) {
  assert(adminList.body.artifacts.some((artifact) => artifact.viewer_path === path), `admin artifact list missing ${path}`);
}
assert(api.request("user-owner", "listPublishedArtifacts").status === 403, "general user must not list admin artifacts");
assert(api.request(undefined, "listPublishedArtifacts").status === 401, "anonymous user must not list admin artifacts");
assert(api.request("admin-1", "issueArtifactAccessCookie", { csrf_token: adminCsrf }).status === 201, "admin must issue artifact access cookie");
assert(api.request("user-owner", "issueArtifactAccessCookie", { csrf_token: userCsrf }).status === 403, "general user must not issue artifact access cookie");
assert(api.request(undefined, "issueArtifactAccessCookie").status === 401, "anonymous user must not issue artifact access cookie");

console.log("admin artifacts check passed");

function assertArtifact(artifact, viewerPath) {
  assert(artifact.viewer_path === viewerPath, `artifact viewer path mismatch: ${viewerPath}`);
  assert(artifact.status === "published-local", `artifact status mismatch: ${viewerPath}`);
  assert(artifact.final_publish_status === "pending_external", `artifact final publish status mismatch: ${viewerPath}`);
  assert(isCurrentJstTimestamp(artifact.generated_at), `artifact generated_at must be current JST timestamp: ${viewerPath}`);
  assert(/^sha256:[a-f0-9]{64}$/.test(artifact.checksum), `artifact checksum format mismatch: ${viewerPath}`);
  const actual = `sha256:${sha256(readFileSync(artifact.index_path))}`;
  assert(artifact.checksum === actual, `artifact checksum content mismatch: ${viewerPath}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
