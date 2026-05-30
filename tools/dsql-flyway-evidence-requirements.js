import { eventSourceMappings, projectionMetadataColumns } from "./db-metadata-lib.js";

export const requiredMigrationVersions = ["V001", "V002", "V003"];

export const requiredCoreTables = [
  "tenants",
  "users",
  "chat_sessions",
  "chat_messages",
  "documents",
  "document_versions",
  "ingestion_jobs",
  "evaluation_runs",
  "tool_invocations"
];

export const requiredEventTables = [...new Set(eventSourceMappings.map((mapping) => mapping.eventTable))].sort();

export const requiredProjectionTables = [...new Set(eventSourceMappings.map((mapping) => mapping.projectionTable))].sort();

export const requiredProjectionColumns = requiredProjectionTables.flatMap((table) => projectionMetadataColumns.map((column) => ({ table, column })));

export const requiredCrudSmokeFlows = ["chat", "document", "ingestion", "evaluation", "tool_invocation"];
