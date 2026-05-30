import { assert } from "./lib.js";
import { assertMetadataMatchesV001, metadataTables, stateProjectionColumnNames } from "./db-metadata-lib.js";
import { execFileSync } from "node:child_process";

execFileSync("node", ["tools/generate-db-tables-runtime-mirror.js", "--check"], { stdio: "inherit" });
assertMetadataMatchesV001(assert);

for (const table of metadataTables()) {
  for (const field of ["japaneseName", "description", "domain", "sourceOfTruthKind", "lifecycle", "retentionPolicy"]) {
    assert(table[field], `${table.tableName} missing table metadata field ${field}`);
  }
  assert(Array.isArray(table.primaryKey) && table.primaryKey.length > 0, `${table.tableName} missing primaryKey`);
  for (const column of table.columns) {
    for (const field of ["japaneseName", "description", "logicalType", "dataClassification", "sourceOfTruthKind", "updateOwner"]) {
      assert(column[field] !== undefined && column[field] !== "", `${table.tableName}.${column.name} missing column metadata field ${field}`);
    }
    assert(typeof column.nullable === "boolean", `${table.tableName}.${column.name} missing nullable boolean`);
    if (stateProjectionColumnNames.has(column.name)) {
      assert(column.sourceOfTruthKind === "projection", `${table.tableName}.${column.name} must be classified as projection`);
      assert(/正本ではなくprojection/.test(column.description), `${table.tableName}.${column.name} must explain projection is not source of truth`);
    }
  }
}

console.log(`DB metadata check passed (${metadataTables().length} tables)`);
