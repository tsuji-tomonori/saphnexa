import { assert, listFiles, readText } from "./lib.js";

const migrationFiles = listFiles(["packages/db-migrations/migrations"], (path) => /\/V\d+__.+\.sql$/.test(path));
const flywayDsqlConfig = readText("packages/db-migrations/flyway-dsql.conf");
assert(/flyway\.executeInTransaction\s*=\s*false/.test(flywayDsqlConfig), "Flyway DSQL profile must set flyway.executeInTransaction=false");

for (const file of migrationFiles) {
  const body = readText(file);
  const counts = countDdlStatements(body);
  assert(counts.commentOn === 0, `${file} must not use COMMENT ON until Aurora DSQL support is verified`);
  assert(counts.createIndex === counts.createIndexAsync, `${file} must use CREATE INDEX ASYNC for Aurora DSQL compatibility`);
  assert(counts.ddlTotal > 0, `${file} must contain at least one DDL statement`);
  if (counts.ddlTotal > 1) {
    assert(/flyway\.executeInTransaction\s*=\s*false/.test(flywayDsqlConfig) || /dsql:executeInTransaction=false/.test(body), `${file} has ${counts.ddlTotal} DDL statements and must declare non-transactional DSQL execution`);
  }
}

const runbook = readText("docs/ops/local-verification.md");
assert(runbook.includes("Aurora DSQL COMMENT ON"), "local verification docs must record Aurora DSQL COMMENT ON verification/TODO");
assert(runbook.includes("docs/generated/db/schema-comments.sql"), "local verification docs must point to generated schema comments");
assert(runbook.includes("flyway.executeInTransaction=false"), "local verification docs must record DSQL Flyway transaction strategy");
assert(runbook.includes("1 DDL / transaction"), "local verification docs must record Aurora DSQL 1 DDL / transaction constraint");

console.log(`DB DSQL compatibility check passed (${migrationFiles.length} migrations)`);

function countDdlStatements(body) {
  const createTable = matchCount(body, /\bCREATE\s+TABLE\b/gi);
  const alterTable = matchCount(body, /\bALTER\s+TABLE\b/gi);
  const dropTable = matchCount(body, /\bDROP\s+TABLE\b/gi);
  const createIndex = matchCount(body, /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b/gi);
  const createIndexAsync = matchCount(body, /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+ASYNC\b/gi);
  const createView = matchCount(body, /\bCREATE\s+VIEW\b/gi);
  const commentOn = matchCount(body, /\bCOMMENT\s+ON\b/gi);
  const ddlTotal = createTable + alterTable + dropTable + createIndex + createView + commentOn;
  return { alterTable, commentOn, createIndex, createIndexAsync, createTable, createView, ddlTotal, dropTable };
}

function matchCount(body, pattern) {
  return [...body.matchAll(pattern)].length;
}
