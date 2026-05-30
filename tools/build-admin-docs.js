import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { adminArtifactPublishBindings } from "../infra/cdk/admin-artifact-publish-bindings.js";
import { currentJstTimestamp, readText } from "./lib.js";

const outputRoot = "dist/admin/docs";
const versions = adminArtifactPublishBindings.docusaurus.versions.map((item) => item.version);
const latestVersion = "v0.17";
const generatedAt = currentJstTimestamp();
const sourceFiles = [
  "apps/docs-site/package.json",
  "apps/docs-site/docusaurus.config.ts",
  "apps/docs-site/sidebars.ts",
  "apps/docs-site/docs/overview.md",
  "apps/docs-site/docs/operations/local-verification.md",
  "docs/acceptance/traceability.md",
  "docs/generated/db/tables.md",
  "docs/generated/db/columns.md",
  "docs/generated/db/er.md",
  "docs/generated/db/lifecycle.md",
  "docs/generated/db/projections.md",
  "docs/generated/db/schema-comments.sql",
  "docs/adr/ADR-0001-local-first-acceptance-slice.md",
  "docs/ops/local-verification.md",
  "docs/ops/runbooks/access-change.md",
  "docs/ops/runbooks/backup-restore.md",
  "docs/ops/runbooks/evaluation-rerun.md",
  "docs/ops/runbooks/incident-response.md",
  "docs/ops/runbooks/reingestion.md",
  "docs/ops/runbooks/rollback.md",
  "docs/ops/runbooks/user-import-failure.md"
];

rmSync(outputRoot, { recursive: true, force: true });

const html = renderSite("Saphnexa admin docs", sourceFiles.map((path) => ({
  path,
  body: readText(path)
})));

const latestIndex = join(outputRoot, "latest/index.html");
write(latestIndex, html);
for (const version of versions) {
  write(join(outputRoot, `versions/${version}/index.html`), html);
}

const manifest = {
  schema_version: "admin-docs-artifact.v1",
  generated_by: "tools/build-admin-docs.js",
  generator: "docusaurus",
  generator_package: adminArtifactPublishBindings.docusaurus.packageName,
  docusaurus_config_path: adminArtifactPublishBindings.docusaurus.configPath,
  docusaurus_build_command: adminArtifactPublishBindings.docusaurus.buildCommand,
  local_artifact_command: adminArtifactPublishBindings.docusaurus.localArtifactCommand,
  latest_version: latestVersion,
  versions,
  cloudfront_signed_cookie_required: adminArtifactPublishBindings.cloudFront.signedCookieRequired,
  final_publish_status: "pending_external",
  artifacts: [
    artifact("admin-docs-latest", adminArtifactPublishBindings.docusaurus.latest, latestIndex, sourceFiles),
    ...adminArtifactPublishBindings.docusaurus.versions.map((target) => artifact(`admin-docs-version-${target.version.replaceAll(".", "-")}`, target, join(outputRoot, `versions/${target.version}/index.html`), sourceFiles))
  ]
};

write(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
write(join(outputRoot, "latest/manifest.json"), `${JSON.stringify(manifest.artifacts[0], null, 2)}\n`);
for (const artifact of manifest.artifacts.filter((item) => item.viewer_path.includes("/versions/"))) {
  write(join(outputRoot, `versions/${artifact.version}/manifest.json`), `${JSON.stringify(artifact, null, 2)}\n`);
}

console.log(`admin docs artifact generated: ${outputRoot}`);

function write(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function artifact(artifact_id, publishTarget, index_path, sources) {
  return {
    artifact_id,
    artifact_type: "design_doc_html",
    title: publishTarget.viewer_path.includes("/versions/") ? `設計書サイト ${publishTarget.version}` : "設計書サイト latest",
    version: publishTarget.version,
    viewer_path: publishTarget.viewer_path,
    s3_prefix: publishTarget.s3_prefix,
    origin_path_prefix: publishTarget.origin_path_prefix,
    index_path,
    generator: "docusaurus",
    docusaurus_config_path: adminArtifactPublishBindings.docusaurus.configPath,
    docusaurus_build_command: adminArtifactPublishBindings.docusaurus.buildCommand,
    publish_candidate_command: publishTarget.publish_candidate_command,
    cloudfront_signed_cookie_required: adminArtifactPublishBindings.cloudFront.signedCookieRequired,
    status: "published-local",
    final_publish_status: "pending_external",
    source_files: sources,
    checksum: `sha256:${sha256(html)}`,
    generated_at: generatedAt
  };
}

function renderSite(title, documents) {
  const nav = documents.map((doc) => `<li><a href="#${slug(doc.path)}">${escapeHtml(doc.path)}</a></li>`).join("\n");
  const sections = documents.map((doc) => `
    <article id="${slug(doc.path)}">
      <h2>${escapeHtml(doc.path)}</h2>
      ${markdownToHtml(doc.body)}
    </article>`).join("\n");
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.65; margin: 0; color: #17202a; background: #f7f9fb; }
    header, main { max-width: 1080px; margin: 0 auto; padding: 24px; }
    header { background: #ffffff; border-bottom: 1px solid #d9e2ec; }
    article { background: #ffffff; border: 1px solid #d9e2ec; border-radius: 6px; padding: 20px; margin: 16px 0; }
    pre { overflow: auto; background: #f1f5f9; padding: 12px; border-radius: 6px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <p>Local acceptance artifact for admin-only publication checks.</p>
    <nav><ul>${nav}</ul></nav>
  </header>
  <main>${sections}</main>
</body>
</html>
`;
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  let inList = false;
  let inPre = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      out.push(inPre ? "</pre>" : "<pre>");
      inPre = !inPre;
      continue;
    }
    if (inPre) {
      out.push(escapeHtml(line));
      continue;
    }
    if (line.startsWith("# ")) out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    else if (line.startsWith("## ")) out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    else if (line.startsWith("### ")) out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    else if (line.startsWith("- ")) {
      if (!inList) out.push("<ul>");
      inList = true;
      out.push(`<li>${escapeHtml(line.slice(2))}</li>`);
    } else {
      if (inList) out.push("</ul>");
      inList = false;
      out.push(line.trim() ? `<p>${escapeHtml(line)}</p>` : "");
    }
  }
  if (inList) out.push("</ul>");
  if (inPre) out.push("</pre>");
  return out.join("\n");
}

function slug(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
