import { dbTableMetadata } from "@saphnexa/db-schema/metadata";

export type DbJson = Record<string, unknown>;
export type DbTimestamp = string;
export type DbUuid = string;

export type DbTableName = keyof DbRowByTable;

export interface DbRowByTable {
  tenants: {
    tenant_id: string;
    tenant_name: string;
    status: string;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
  };
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
  user_groups: {
    tenant_id: string;
    group_id: string;
    group_name: string;
    group_type: string;
    status: string;
    created_at: DbTimestamp;
  };
  user_group_memberships: {
    tenant_id: string;
    user_id: string;
    group_id: string;
    source: string;
    created_at: DbTimestamp;
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
  reference_nodes: {
    tenant_id: string;
    node_id: string;
    document_id: string;
    version_id: string;
    node_type: string;
    title: string | null;
    page_number: number | null;
    section_label: string | null;
    chunk_id: string | null;
  };
  reference_edges: {
    tenant_id: string;
    source_node_id: string;
    target_node_id: string;
    edge_type: string;
    confidence: number | null;
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
  user_import_jobs: {
    tenant_id: string;
    import_id: string;
    status: string;
    result_s3_prefix: string;
    created_by_user_id: string;
    created_at: DbTimestamp;
  };
  user_import_rows: {
    tenant_id: string;
    import_id: string;
    row_number: number;
    status: string;
    error_message: string | null;
  };
  evaluation_datasets: {
    tenant_id: string;
    dataset_id: string;
    dataset_name: string;
    status: string;
    source_s3_uri: string;
    created_at: DbTimestamp;
  };
  evaluation_cases: {
    tenant_id: string;
    case_id: DbUuid;
    dataset_id: string;
    question: string;
    expected_answer: string | null;
    expected_citation_json: DbJson | null;
    answerability: string;
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
    case_id: DbUuid;
    status: string;
    answer_text: string | null;
    retrieved_context_json: DbJson | null;
    judge_result_json: DbJson | null;
    metrics_json: DbJson | null;
  };
  llm_models: {
    tenant_id: string;
    model_id: string;
    display_name: string;
    provider: string;
    model_type: string;
    capability_json: DbJson;
    status: string;
    visible_to_user: boolean;
    allowed_role: string | null;
    default_for_task: string | null;
    catalog_version: string;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
  };
  bm25_search_documents: {
    tenant_id: string;
    collection_id: DbUuid;
    doc_id: DbUuid;
    source_chunk_id: string;
    title: string | null;
    snippet: string | null;
    doc_type: string | null;
    is_deleted: boolean;
  };
  bm25_postings: {
    tenant_id: string;
    collection_id: DbUuid;
    term_id: DbUuid;
    doc_id: DbUuid;
    field_id: number;
    tf: number;
    field_len: number;
  };
  bm25_term_stats: {
    tenant_id: string;
    collection_id: DbUuid;
    stats_version: DbUuid;
    term_id: DbUuid;
    df: number;
    idf: number;
  };
  bm25_field_stats: {
    tenant_id: string;
    collection_id: DbUuid;
    stats_version: DbUuid;
    field_id: number;
    avg_len: number;
  };
  event_delivery_logs: {
    tenant_id: string;
    delivery_id: DbUuid;
    channel_path: string;
    event_id: DbUuid;
    status: string;
    attempt_count: number;
    error_message: string | null;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
  };
  audit_events: {
    tenant_id: string;
    audit_event_id: DbUuid;
    actor_user_id: string;
    event_name: string;
    category: string;
    resource_id: string;
    payload_json: DbJson | null;
    created_at: DbTimestamp;
  };
  agent_tools: {
    tenant_id: string;
    tool_name: string;
    display_name: string;
    description: string;
    input_schema_json: DbJson;
    output_schema_json: DbJson;
    tool_scope: string;
    side_effect_type: string;
    timeout_ms: number;
    status: string;
    created_at: DbTimestamp;
    updated_at: DbTimestamp;
  };
  tool_invocations: {
    tenant_id: string;
    invocation_id: DbUuid;
    run_id: DbUuid;
    chat_id: DbUuid | null;
    message_id: DbUuid | null;
    tool_name: string;
    request_hash: string;
    response_summary_json: DbJson | null;
    status: string;
    latency_ms: number | null;
    error_code: string | null;
    error_message: string | null;
    created_at: DbTimestamp;
    completed_at: DbTimestamp | null;
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
  test_report_runs: {
    tenant_id: string;
    test_run_id: DbUuid;
    artifact_id: string;
    workflow_run_id: string | null;
    commit_sha: string;
    branch_name: string;
    environment: string;
    test_suite: string;
    status: string;
    total_count: number;
    passed_count: number;
    failed_count: number;
    skipped_count: number;
    duration_ms: number | null;
    started_at: DbTimestamp;
    completed_at: DbTimestamp | null;
    created_at: DbTimestamp;
  };
  schema_migrations: {
    installed_rank: number;
    version: string | null;
    description: string;
    type: string;
    script: string;
    checksum: number | null;
    installed_by: string;
    installed_on: DbTimestamp;
    execution_time: number;
    success: boolean;
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
