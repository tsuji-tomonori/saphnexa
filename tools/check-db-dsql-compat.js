import { assert, listFiles, readText } from "./lib.js";

const migrationFiles = listFiles(["packages/db-migrations/migrations"], (path) => /\/V\d+__.+\.sql$/.test(path));
for (const file of migrationFiles) {
  const body = readText(file);
  assert(!/\bCOMMENT ON\b/i.test(body), `${file} must not use COMMENT ON until Aurora DSQL support is verified`);
  assert(!/\bCREATE INDEX\b(?!\s+ASYNC)/i.test(body), `${file} must use CREATE INDEX ASYNC for Aurora DSQL compatibility`);
}

const runbook = readText("docs/ops/local-verification.md");
assert(runbook.includes("Aurora DSQL COMMENT ON"), "local verification docs must record Aurora DSQL COMMENT ON verification/TODO");
assert(runbook.includes("docs/generated/db/schema-comments.sql"), "local verification docs must point to generated schema comments");

console.log(`DB DSQL compatibility check passed (${migrationFiles.length} migrations)`);
