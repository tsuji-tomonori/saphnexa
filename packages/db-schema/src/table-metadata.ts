import type { RequiredTableName } from "./tables";

export type DbLogicalType = "string" | "uuid" | "integer" | "bigint" | "float" | "json" | "timestamp" | "text" | "boolean";

export interface DbColumnMetadata {
  name: string;
  logicalType: DbLogicalType;
  nullable: boolean;
}

export interface DbTableMetadata {
  tableName: RequiredTableName;
  primaryKey: readonly string[];
  columns: readonly DbColumnMetadata[];
}

export const dbTableMetadata = [
  table("users", ["tenant_id", "user_id"], [
    column("tenant_id", "string", false),
    column("user_id", "string", false),
    column("email", "string", false),
    column("display_name", "string", false),
    column("role", "string", false),
    column("department", "string", true),
    column("employment_type", "string", true),
    column("status", "string", false),
    column("created_at", "timestamp", false),
    column("updated_at", "timestamp", false)
  ]),
  table("web_sessions", ["tenant_id", "session_id"], [
    column("tenant_id", "string", false),
    column("session_id", "string", false),
    column("user_id", "string", false),
    column("refresh_token_ref", "string", false),
    column("csrf_secret_hash", "string", false),
    column("status", "string", false),
    column("expires_at", "timestamp", false),
    column("created_at", "timestamp", false),
    column("updated_at", "timestamp", false)
  ]),
  table("chat_sessions", ["tenant_id", "chat_id"], [
    column("tenant_id", "string", false),
    column("chat_id", "uuid", false),
    column("title", "string", false),
    column("status", "string", false),
    column("last_message_at", "timestamp", true),
    column("created_by_user_id", "string", false),
    column("created_at", "timestamp", false),
    column("updated_at", "timestamp", false),
    column("deleted_at", "timestamp", true)
  ]),
  table("chat_participants", ["tenant_id", "chat_id", "user_id"], [
    column("tenant_id", "string", false),
    column("chat_id", "uuid", false),
    column("user_id", "string", false),
    column("participant_role", "string", false),
    column("status", "string", false),
    column("added_by_user_id", "string", false),
    column("added_at", "timestamp", false),
    column("removed_at", "timestamp", true)
  ]),
  table("chat_messages", ["tenant_id", "chat_id", "message_id"], [
    column("tenant_id", "string", false),
    column("chat_id", "uuid", false),
    column("message_id", "uuid", false),
    column("parent_message_id", "uuid", true),
    column("sender_user_id", "string", true),
    column("sender_type", "string", false),
    column("content_text", "text", true),
    column("run_id", "uuid", true),
    column("status", "string", false),
    column("created_at", "timestamp", false),
    column("completed_at", "timestamp", true)
  ]),
  table("chat_runs", ["tenant_id", "run_id"], [
    column("tenant_id", "string", false),
    column("run_id", "uuid", false),
    column("chat_id", "uuid", false),
    column("message_id", "uuid", false),
    column("requested_by_user_id", "string", false),
    column("retrieval_policy_json", "json", false),
    column("model_id", "string", false),
    column("prompt_version", "string", false),
    column("status", "string", false),
    column("started_at", "timestamp", true),
    column("completed_at", "timestamp", true),
    column("error_code", "string", true)
  ]),
  table("chat_message_events", ["tenant_id", "chat_id", "message_id", "event_seq"], [
    column("tenant_id", "string", false),
    column("chat_id", "uuid", false),
    column("message_id", "uuid", false),
    column("event_seq", "bigint", false),
    column("event_id", "uuid", false),
    column("event_name", "string", false),
    column("event_type", "string", false),
    column("payload_json", "json", false),
    column("created_at", "timestamp", false)
  ]),
  table("citation_records", ["tenant_id", "chat_id", "message_id", "citation_id"], [
    column("tenant_id", "string", false),
    column("chat_id", "uuid", false),
    column("message_id", "uuid", false),
    column("citation_id", "string", false),
    column("document_id", "string", false),
    column("version_id", "string", false),
    column("chunk_id", "string", false),
    column("display_json", "json", false),
    column("created_at", "timestamp", false)
  ]),
  table("message_feedback", ["tenant_id", "chat_id", "message_id", "user_id"], [
    column("tenant_id", "string", false),
    column("feedback_id", "uuid", false),
    column("chat_id", "uuid", false),
    column("message_id", "uuid", false),
    column("user_id", "string", false),
    column("rating", "string", false),
    column("comment", "text", true),
    column("problem_type", "string", true),
    column("created_at", "timestamp", false)
  ]),
  table("favorites", ["tenant_id", "favorite_id"], [
    column("tenant_id", "string", false),
    column("favorite_id", "uuid", false),
    column("user_id", "string", false),
    column("chat_id", "uuid", true),
    column("message_id", "uuid", true),
    column("created_at", "timestamp", false)
  ]),
  table("document_acl_entries", ["tenant_id", "document_id", "version_id", "acl_scope_id"], [
    column("tenant_id", "string", false),
    column("document_id", "string", false),
    column("version_id", "string", false),
    column("acl_scope_id", "string", false),
    column("effect", "string", false)
  ]),
  table("ws_tickets", ["tenant_id", "ticket_id"], [
    column("tenant_id", "string", false),
    column("ticket_id", "string", false),
    column("session_id", "string", false),
    column("user_id", "string", false),
    column("channel_scope_json", "json", false),
    column("status", "string", false),
    column("expires_at", "timestamp", false),
    column("used_at", "timestamp", true)
  ]),
  table("tool_invocations", ["tenant_id", "invocation_id"], [
    column("tenant_id", "string", false),
    column("invocation_id", "string", false),
    column("run_id", "uuid", false),
    column("tool_name", "string", false),
    column("status", "string", false),
    column("input_json", "json", false),
    column("output_json", "json", true),
    column("created_at", "timestamp", false)
  ]),
  table("evaluation_datasets", ["tenant_id", "dataset_id"], [
    column("tenant_id", "string", false),
    column("dataset_id", "string", false),
    column("dataset_name", "string", false),
    column("status", "string", false),
    column("source_s3_uri", "string", false),
    column("created_at", "timestamp", false)
  ]),
  table("evaluation_runs", ["tenant_id", "evaluation_run_id"], [
    column("tenant_id", "string", false),
    column("evaluation_run_id", "string", false),
    column("dataset_id", "string", false),
    column("model_id", "string", false),
    column("prompt_version", "string", false),
    column("retrieval_config_json", "json", false),
    column("artifact_s3_prefix", "string", true),
    column("status", "string", false),
    column("metrics_json", "json", true),
    column("created_by_user_id", "string", false)
  ]),
  table("evaluation_run_items", ["tenant_id", "evaluation_run_id", "case_id"], [
    column("tenant_id", "string", false),
    column("evaluation_run_id", "string", false),
    column("case_id", "uuid", false),
    column("status", "string", false),
    column("answer_text", "string", true),
    column("retrieved_context_json", "json", true),
    column("judge_result_json", "json", true),
    column("metrics_json", "json", true)
  ]),
  table("llm_models", ["tenant_id", "model_id"], [
    column("tenant_id", "string", false),
    column("model_id", "string", false),
    column("display_name", "string", false),
    column("provider", "string", false),
    column("model_type", "string", false),
    column("capability_json", "json", false),
    column("status", "string", false),
    column("visible_to_user", "boolean", false),
    column("allowed_role", "string", true),
    column("default_for_task", "string", true),
    column("catalog_version", "string", false),
    column("created_at", "timestamp", false),
    column("updated_at", "timestamp", false)
  ]),
  table("published_artifacts", ["tenant_id", "artifact_id"], [
    column("tenant_id", "string", false),
    column("artifact_id", "string", false),
    column("artifact_type", "string", false),
    column("title", "string", false),
    column("version_label", "string", true),
    column("source_ref", "string", true),
    column("s3_bucket", "string", false),
    column("s3_prefix", "string", false),
    column("viewer_path", "string", false),
    column("status", "string", false),
    column("checksum", "string", true),
    column("published_by", "string", false),
    column("published_at", "timestamp", true),
    column("expires_at", "timestamp", true),
    column("created_at", "timestamp", false),
    column("updated_at", "timestamp", false)
  ])
] as const satisfies readonly DbTableMetadata[];

export type DbMetadataTableName = (typeof dbTableMetadata)[number]["tableName"];

export function getDbTableMetadata(tableName: DbMetadataTableName): DbTableMetadata {
  const metadata = dbTableMetadata.find((item) => item.tableName === tableName);
  if (!metadata) throw new Error(`unknown DB table metadata ${tableName}`);
  return metadata;
}

function table(tableName: RequiredTableName, primaryKey: readonly string[], columns: readonly DbColumnMetadata[]): DbTableMetadata {
  return { tableName, primaryKey, columns };
}

function column(name: string, logicalType: DbLogicalType, nullable: boolean): DbColumnMetadata {
  return { name, logicalType, nullable };
}
