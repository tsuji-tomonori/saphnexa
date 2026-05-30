import { assert, readText } from "./lib.js";
import { eventSourceMappings, metadataTables, projectionMetadataColumns, stateProjectionColumnNames } from "./db-metadata-lib.js";
import { execFileSync } from "node:child_process";

execFileSync("node", ["tools/generate-db-docs.js"], { stdio: "inherit" });

const eventMigration = readText("packages/db-migrations/migrations/V002__event_source_projection_tables.sql");
const projectionMigration = readText("packages/db-migrations/migrations/V003__projection_metadata_columns.sql");
const projectionDocs = readText("docs/generated/db/projections.md");
const eventTables = new Set(eventSourceMappings.map((mapping) => mapping.eventTable));
const projectionTables = new Set(eventSourceMappings.map((mapping) => mapping.projectionTable));

for (const mapping of eventSourceMappings) {
  assert(new RegExp(`CREATE TABLE ${mapping.eventTable}\\b`, "i").test(eventMigration), `event migration missing ${mapping.eventTable}`);
  assert(projectionDocs.includes(mapping.eventTable), `projection docs missing event table ${mapping.eventTable}`);
  assert(projectionDocs.includes(mapping.projectionTable), `projection docs missing projection table ${mapping.projectionTable}`);
  for (const column of projectionMetadataColumns) {
    assert(new RegExp(`ALTER TABLE ${mapping.projectionTable}\\s+ADD COLUMN ${column}\\b`, "i").test(projectionMigration), `projection migration missing ${mapping.projectionTable}.${column}`);
  }
}

for (const table of metadataTables()) {
  for (const column of table.columns) {
    if (column.sourceOfTruthKind === "projection") {
      assert(projectionTables.has(table.tableName), `${table.tableName}.${column.name} is projection but table is not in eventSourceMappings`);
      assert(column.derivedFrom && eventTables.has(column.derivedFrom), `${table.tableName}.${column.name} projection must derive from a concrete event table`);
      assert(!/対応するdomain event|具体event table未設定/i.test(column.derivedFrom), `${table.tableName}.${column.name} must not use an ambiguous derivedFrom`);
      assert(!/対応するdomain event|具体event table未設定/i.test(column.description), `${table.tableName}.${column.name} description must not use ambiguous domain event wording`);
    }
    if (stateProjectionColumnNames.has(column.name)) {
      assert(column.sourceOfTruthKind === "projection", `${table.tableName}.${column.name} must be projection`);
      assert(/正本ではなくprojection/.test(column.description), `${table.tableName}.${column.name} must document projection source-of-truth boundary`);
    }
  }
}

for (const tableName of projectionTables) {
  for (const column of projectionMetadataColumns) {
    assert(new RegExp(`ALTER TABLE ${tableName}\\s+ADD COLUMN ${column}\\b`, "i").test(projectionMigration), `projection migration missing ${tableName}.${column}`);
  }
}

assert(projectionDocs.includes("chat_message_events") && projectionDocs.includes("domain event正本とは分け"), "docs must distinguish UI message events from domain event source");
assert(!projectionDocs.includes("対応するdomain event"), "projection docs must not contain ambiguous derivedFrom wording");

console.log(`DB event-source check passed (${eventSourceMappings.length} event tables)`);
