import { dbTableMetadata } from "@saphnexa/db-schema/metadata";

export type DbJson = Record<string, unknown>;
export type DbTimestamp = string;
export type DbUuid = string;

export type DbTableName = keyof DbRowByTable;

export interface DbRowByTable {
  users: {
    tenant_id: string;
    user_id: string;
    email: string;
    display_name: string;
    role: string;
    department: string | null;
    employment_type: string | null;
    status: string;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
  };
  web_sessions: {
    tenant_id: string;
    session_id: string;
    user_id: string;
    refresh_token_ref: string;
    csrf_secret_hash: string;
    status: string;
    expires_at: DbTimestamp;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
  };
  chat_sessions: {
    tenant_id: string;
    chat_id: DbUuid;
    title: string;
    status: string;
    last_message_at: DbTimestamp | null;
    created_by_user_id: string;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
    deleted_at: DbTimestamp | null;
  };
  chat_participants: {
    tenant_id: string;
    chat_id: DbUuid;
    user_id: string;
    participant_role: string;
    status: string;
    added_by_user_id: string;
    added_at: DbTimestamp;
    removed_at: DbTimestamp | null;
  };
  chat_messages: {
    tenant_id: string;
    chat_id: DbUuid;
    message_id: DbUuid;
    parent_message_id: DbUuid | null;
    sender_user_id: string | null;
    sender_type: string;
    content_text: string | null;
    run_id: DbUuid | null;
    status: string;
    created_at: DbTimestamp;
    completed_at: DbTimestamp | null;
  };
  chat_runs: {
    tenant_id: string;
    run_id: DbUuid;
    chat_id: DbUuid;
    message_id: DbUuid;
    requested_by_user_id: string;
    retrieval_policy_json: DbJson;
    model_id: string;
    prompt_version: string;
    status: string;
    started_at: DbTimestamp | null;
    completed_at: DbTimestamp | null;
    error_code: string | null;
  };
  chat_message_events: {
    tenant_id: string;
    chat_id: DbUuid;
    message_id: DbUuid;
    event_seq: number;
    event_id: DbUuid;
    event_name: string;
    event_type: string;
    payload_json: DbJson;
    created_at: DbTimestamp;
  };
  citation_records: {
    tenant_id: string;
    chat_id: DbUuid;
    message_id: DbUuid;
    citation_id: string;
    document_id: string;
    version_id: string;
    chunk_id: string;
    display_json: DbJson;
    created_at: DbTimestamp;
  };
  message_feedback: {
    tenant_id: string;
    feedback_id: DbUuid;
    chat_id: DbUuid;
    message_id: DbUuid;
    user_id: string;
    rating: string;
    comment: string | null;
    problem_type: string | null;
    created_at: DbTimestamp;
  };
  favorites: {
    tenant_id: string;
    favorite_id: DbUuid;
    user_id: string;
    chat_id: DbUuid | null;
    message_id: DbUuid | null;
    created_at: DbTimestamp;
  };
  documents: {
    tenant_id: string;
    document_id: string;
    title: string;
    status: string;
    created_by_user_id: string;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
  };
  document_versions: {
    tenant_id: string;
    document_id: string;
    version_id: string;
    version_label: string;
    status: string;
    raw_s3_uri: string;
    metadata_json: DbJson;
    created_at: DbTimestamp;
  };
  document_acl_entries: {
    tenant_id: string;
    document_id: string;
    version_id: string;
    acl_scope_id: string;
    effect: string;
  };
  ingestion_jobs: {
    tenant_id: string;
    job_id: string;
    document_id: string;
    version_id: string;
    status: string;
    raw_s3_uri: string;
    parsed_s3_prefix: string;
    error_code: string | null;
    created_at: DbTimestamp;
  };
  evaluation_datasets: {
    tenant_id: string;
    dataset_id: string;
    dataset_name: string;
    status: string;
    source_s3_uri: string;
    created_at: DbTimestamp;
  };
  evaluation_runs: {
    tenant_id: string;
    evaluation_run_id: string;
    dataset_id: string;
    model_id: string;
    prompt_version: string;
    retrieval_config_json: DbJson;
    artifact_s3_prefix: string | null;
    status: string;
    metrics_json: DbJson | null;
    created_by_user_id: string;
  };
  evaluation_run_items: {
    tenant_id: string;
    evaluation_run_id: string;
    case_id: string;
    status: string;
    answer_text: string | null;
    retrieved_context_json: DbJson | null;
    judge_result_json: DbJson | null;
    metrics_json: DbJson | null;
  };
  ws_tickets: {
    tenant_id: string;
    ticket_id: string;
    session_id: string;
    user_id: string;
    channel_scope_json: DbJson;
    status: string;
    expires_at: DbTimestamp;
    used_at: DbTimestamp | null;
  };
  tool_invocations: {
    tenant_id: string;
    invocation_id: string;
    run_id: DbUuid;
    tool_name: string;
    status: string;
    input_json: DbJson;
    output_json: DbJson | null;
    created_at: DbTimestamp;
  };
  published_artifacts: {
    tenant_id: string;
    artifact_id: string;
    artifact_type: string;
    title: string;
    version_label: string | null;
    source_ref: string | null;
    s3_bucket: string;
    s3_prefix: string;
    viewer_path: string;
    status: string;
    checksum: string | null;
    published_by: string;
    published_at: DbTimestamp | null;
    expires_at: DbTimestamp | null;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
  };
}

export type DbRow<TTable extends DbTableName> = DbRowByTable[TTable];
export type DbPrimaryKeyByTable = {
  [TTable in DbTableName]: Extract<(typeof dbTableMetadata)[number], { tableName: TTable }>["primaryKey"][number];
};
export type DbPrimaryKey<TTable extends DbTableName> = DbPrimaryKeyByTable[TTable];
export type DbInsert<TTable extends DbTableName> = Pick<DbRow<TTable>, RequiredInsertColumn<TTable>> & Partial<Pick<DbRow<TTable>, OptionalInsertColumn<TTable>>>;
export type DbUpdate<TTable extends DbTableName> = Partial<Omit<DbRow<TTable>, DbPrimaryKey<TTable>>>;

type NullableColumn<TTable extends DbTableName> = {
  [TColumn in keyof DbRow<TTable>]: null extends DbRow<TTable>[TColumn] ? TColumn : never;
}[keyof DbRow<TTable>];

type OptionalInsertColumn<TTable extends DbTableName> = Extract<NullableColumn<TTable>, keyof DbRow<TTable>>;
type RequiredInsertColumn<TTable extends DbTableName> = Exclude<keyof DbRow<TTable>, OptionalInsertColumn<TTable>>;

export const dbTypeTableNames = dbTableMetadata.map((item) => item.tableName) as DbTableName[];
