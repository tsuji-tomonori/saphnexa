import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { assert } from "./lib.js";
import { metadataColumnCount, metadataTables } from "./db-metadata-lib.js";

execFileSync("node", ["tools/generate-db-comments.js"], { stdio: "inherit" });

const comments = readFileSync("packages/db-migrations/generated/schema-comments.sql", "utf8");
const tableCommentCount = [...comments.matchAll(/^COMMENT ON TABLE /gm)].length;
const columnCommentCount = [...comments.matchAll(/^COMMENT ON COLUMN /gm)].length;

assert(tableCommentCount === metadataTables().length, `table COMMENT count mismatch: ${tableCommentCount}`);
assert(columnCommentCount === metadataColumnCount(), `column COMMENT count mismatch: ${columnCommentCount}`);
assert(comments.includes("正本ではなくprojection"), "schema comments must explain projection columns are not source of truth");

const docsCopy = readFileSync("docs/generated/db/schema-comments.sql", "utf8");
assert(docsCopy === comments, "docs schema-comments.sql must match migration generated copy");

console.log(`DB comments check passed (${tableCommentCount} table comments, ${columnCommentCount} column comments)`);
