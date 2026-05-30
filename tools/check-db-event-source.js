import { assert, readText } from "./lib.js";
import { eventSourceMappings, metadataTables, projectionMetadataColumns, stateProjectionColumnNames } from "./db-metadata-lib.js";
import { execFileSync } from "node:child_process";

execFileSync("node", ["tools/generate-db-docs.js"], { stdio: "inherit" });

const eventMigration = readText("packages/db-migrations/migrations/V002__event_source_projection_tables.sql");
const projectionMigration = readText("packages/db-migrations/migrations/V003__projection_metadata_columns.sql");
const projectionDocs = readText("docs/generated/db/projections.md");

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
    if (stateProjectionColumnNames.has(column.name)) {
      assert(column.sourceOfTruthKind === "projection", `${table.tableName}.${column.name} must be projection`);
      assert(/正本ではなくprojection/.test(column.description), `${table.tableName}.${column.name} must document projection source-of-truth boundary`);
    }
  }
}

assert(projectionDocs.includes("chat_message_events") && projectionDocs.includes("domain event正本とは分け"), "docs must distinguish UI message events from domain event source");

console.log(`DB event-source check passed (${eventSourceMappings.length} event tables)`);
