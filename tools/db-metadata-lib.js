import { readText } from "./lib.js";
import { dbTableMetadata } from "../packages/db-schema/src/table-metadata.js";
import { requiredTables } from "../packages/db-schema/src/tables.js";

export const eventSourceMappings = [
  { projectionTable: "tenants", eventTable: "tenant_events", updateOwner: "projector" },
  { projectionTable: "users", eventTable: "user_events", updateOwner: "projector" },
  { projectionTable: "web_sessions", eventTable: "web_session_events", updateOwner: "projector" },
  { projectionTable: "chat_sessions", eventTable: "chat_session_events", updateOwner: "projector" },
  { projectionTable: "chat_participants", eventTable: "chat_participant_events", updateOwner: "projector" },
  { projectionTable: "chat_runs", eventTable: "chat_run_events", updateOwner: "projector" },
  { projectionTable: "documents", eventTable: "document_events", updateOwner: "projector" },
  { projectionTable: "document_versions", eventTable: "document_version_events", updateOwner: "projector" },
  { projectionTable: "document_acl_entries", eventTable: "document_acl_events", updateOwner: "projector" },
  { projectionTable: "ingestion_jobs", eventTable: "ingestion_job_events", updateOwner: "worker" },
  { projectionTable: "user_import_jobs", eventTable: "user_import_job_events", updateOwner: "worker" },
  { projectionTable: "evaluation_runs", eventTable: "evaluation_run_events", updateOwner: "worker" },
  { projectionTable: "published_artifacts", eventTable: "published_artifact_events", updateOwner: "ci" },
  { projectionTable: "tool_invocations", eventTable: "tool_invocation_events", updateOwner: "agent" },
  { projectionTable: "test_report_runs", eventTable: "test_report_run_events", updateOwner: "ci" }
];

export const projectionMetadataColumns = ["projection_event_id", "projection_event_seq", "projected_at"];
export const stateProjectionColumnNames = new Set(["status", "is_deleted", "deleted_at", "updated_at", "removed_at", "used_at", "completed_at", "started_at", "published_at", "expires_at", "last_message_at"]);

export function metadataTables() {
  return dbTableMetadata;
}

export function metadataColumnCount() {
  return dbTableMetadata.reduce((sum, table) => sum + table.columns.length, 0);
}

export function schemaTables() {
  const schema = readText("packages/db-migrations/migrations/V001__initial_saphnexa_schema.sql");
  const tables = [];
  const tableRe = /CREATE TABLE ([a-z0-9_]+) \(([\s\S]*?)\n\);/g;
  for (const match of schema.matchAll(tableRe)) {
    const tableName = match[1];
    const body = match[2];
    const columns = [];
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim().replace(/,$/, "");
      if (!line || /^PRIMARY KEY/i.test(line)) continue;
      const column = line.match(/^([a-z0-9_]+)\s+(.+)$/i);
      if (column) columns.push(column[1]);
    }
    tables.push({ tableName, columns });
  }
  return tables;
}

export function assertMetadataMatchesV001(assert) {
  const byName = new Map(dbTableMetadata.map((table) => [table.tableName, table]));
  const schemaByName = new Map(schemaTables().map((table) => [table.tableName, table]));
  for (const tableName of requiredTables) {
    assert(schemaByName.has(tableName), `V001 missing required table ${tableName}`);
    assert(byName.has(tableName), `metadata missing required table ${tableName}`);
  }
  for (const schemaTable of schemaByName.values()) {
    const metadata = byName.get(schemaTable.tableName);
    assert(metadata, `metadata missing V001 table ${schemaTable.tableName}`);
    for (const column of schemaTable.columns) {
      assert(metadata.columns.some((item) => item.name === column), `metadata missing ${schemaTable.tableName}.${column}`);
    }
  }
}

export function sqlQuote(value) {
  return String(value).replaceAll("'", "''");
}
