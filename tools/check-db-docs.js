import { execFileSync } from "node:child_process";
import { assert, readText } from "./lib.js";
import { eventSourceMappings, metadataTables } from "./db-metadata-lib.js";

execFileSync("node", ["tools/generate-db-docs.js"], { stdio: "inherit" });

for (const file of [
  "docs/generated/db/tables.md",
  "docs/generated/db/columns.md",
  "docs/generated/db/er.md",
  "docs/generated/db/lifecycle.md",
  "docs/generated/db/projections.md",
  "docs/generated/db/schema-comments.sql"
]) {
  const body = readText(file);
  assert(body.length > 0, `${file} must not be empty`);
}

const tablesDoc = readText("docs/generated/db/tables.md");
for (const table of metadataTables()) assert(tablesDoc.includes(`\`${table.tableName}\``), `tables docs missing ${table.tableName}`);

const projectionsDoc = readText("docs/generated/db/projections.md");
for (const mapping of eventSourceMappings) {
  assert(projectionsDoc.includes(mapping.eventTable), `projection docs missing ${mapping.eventTable}`);
  assert(projectionsDoc.includes(mapping.projectionTable), `projection docs missing ${mapping.projectionTable}`);
}
assert(projectionsDoc.includes("状態列を正本として直接更新しない"), "projection docs must state API direct status update boundary");

console.log("DB docs check passed");
