import { existsSync } from "node:fs";
import { adminArtifactPublishBindings } from "../infra/cdk/admin-artifact-publish-bindings.js";
import { edgeIdentityRealtimeBindings } from "../infra/cdk/edge-identity-realtime-bindings.js";
import { assert, readJson, readText } from "./lib.js";

const binding = adminArtifactPublishBindings;
const packageJson = readJson("package.json");
const docsPackage = readJson("apps/docs-site/package.json");
const docsConfig = readText(binding.docusaurus.configPath);
const sidebar = readText(binding.docusaurus.sidebarPath);
const ciWorkflow = readText(".github/workflows/ci.yml");
const externalActions = readText("tools/external-acceptance-actions.js");
const docsManifest = readJson("dist/admin/docs/manifest.json");
const reportManifest = readJson("dist/admin/test-reports/allure/latest/manifest.json");

assert(binding.adminArtifactsBucketLogicalId === "AdminArtifactsBucket", "admin artifacts bucket binding mismatch");
assert(binding.cloudFront.signedCookieRequired === true, "admin artifact CloudFront signed cookie binding missing");
for (const pattern of ["/admin/docs/*", "/admin/test-reports/*"]) {
  assert(binding.cloudFront.protectedViewerPatterns.includes(pattern), `publish binding missing protected pattern ${pattern}`);
  assert(edgeIdentityRealtimeBindings.adminArtifactAccess.trustedPathPatterns.includes(pattern), `edge binding missing trusted pattern ${pattern}`);
}

assert(packageJson.workspaces.includes("apps/*"), "root workspaces must include apps");
assert(packageJson.scripts["admin-artifacts:publish:check"] === "node tools/check-admin-artifact-publish-bindings.js", "publish check script mismatch");
assert(packageJson.scripts.verify.includes("npm run admin-artifacts:publish:check"), "verify script must include publish check");
assert(docsPackage.name === binding.docusaurus.packageName, "Docusaurus package name mismatch");
assert(docsPackage.private === true, "Docusaurus package must be private");
assert(docsPackage.scripts.build === "docusaurus build", "Docusaurus build script mismatch");
for (const dep of ["@docusaurus/core", "@docusaurus/preset-classic", "@mdx-js/react", "react", "react-dom"]) {
  assert(docsPackage.dependencies[dep], `Docusaurus package missing dependency ${dep}`);
}
assert(docsConfig.includes("baseUrl"), "Docusaurus config must define baseUrl");
assert(docsConfig.includes("/admin/docs/latest/"), "Docusaurus config must default to admin docs latest baseUrl");
assert(docsConfig.includes("routeBasePath: \"/\""), "Docusaurus docs routeBasePath must be root");
assert(sidebar.includes("overview"), "Docusaurus sidebar must include overview doc");
for (const path of ["apps/docs-site/docs/overview.md", "apps/docs-site/docs/operations/local-verification.md"]) {
  assert(existsSync(path), `Docusaurus source missing ${path}`);
}

assert(docsManifest.generator === "docusaurus", "docs manifest generator mismatch");
assert(docsManifest.docusaurus_build_command === binding.docusaurus.buildCommand, "docs manifest Docusaurus build command mismatch");
assert(docsManifest.latest_version === "v0.17", "docs manifest latest version mismatch");
assert(docsManifest.cloudfront_signed_cookie_required === true, "docs manifest signed cookie flag mismatch");
assert(docsManifest.final_publish_status === "pending_external", "docs manifest must remain pending external");
for (const target of [binding.docusaurus.latest, ...binding.docusaurus.versions]) {
  const artifact = docsManifest.artifacts.find((item) => item.viewer_path === target.viewer_path);
  assert(artifact, `docs manifest missing ${target.viewer_path}`);
  assert(artifact.s3_prefix === target.s3_prefix, `docs s3 prefix mismatch for ${target.viewer_path}`);
  assert(artifact.origin_path_prefix === target.origin_path_prefix, `docs origin path mismatch for ${target.viewer_path}`);
  assert(artifact.publish_candidate_command === target.publish_candidate_command, `docs publish command mismatch for ${target.viewer_path}`);
  assert(externalActions.includes(target.publish_candidate_command), `external action missing docs command ${target.publish_candidate_command}`);
}

assert(reportManifest.generator === binding.allure.generator, "Allure manifest generator mismatch");
assert(reportManifest.allure_generate_command === binding.allure.generateCommand, "Allure generate command mismatch");
assert(reportManifest.s3_prefix === binding.allure.latest.s3_prefix, "Allure latest s3 prefix mismatch");
assert(reportManifest.run_s3_prefix_pattern === binding.allure.run.s3_prefix, "Allure run s3 prefix mismatch");
assert(reportManifest.raw_results_s3_prefix_pattern === binding.allure.rawResults.s3_prefix_pattern, "Allure raw results prefix mismatch");
assert(reportManifest.publish_candidate_command === binding.allure.latest.publish_candidate_command, "Allure publish command mismatch");
assert(reportManifest.run_publish_candidate_command === binding.allure.run.publish_candidate_command, "Allure run publish command mismatch");
assert(reportManifest.cloudfront_signed_cookie_required === true, "Allure manifest signed cookie flag mismatch");
assert(reportManifest.final_publish_status === "pending_external", "Allure manifest must remain pending external");
assert(externalActions.includes(binding.allure.latest.publish_candidate_command), "external action missing Allure latest publish command");
assert(externalActions.includes(binding.allure.run.publish_candidate_command), "external action missing Allure run publish command");

for (const command of ["npm run admin-artifacts:publish:check", "npm run artifacts:check"]) {
  assert(ciWorkflow.includes(command), `CI workflow missing ${command}`);
}

console.log("admin artifact publish binding check passed");
