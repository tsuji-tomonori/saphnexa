-- Projection lineage columns for DB design v0.17案B.
-- These columns record which append-only event produced the current read-model state.
-- dsql:executeInTransaction=false

ALTER TABLE tenants ADD COLUMN projection_event_id uuid;
ALTER TABLE tenants ADD COLUMN projection_event_seq bigint;
ALTER TABLE tenants ADD COLUMN projected_at timestamptz;

ALTER TABLE users ADD COLUMN projection_event_id uuid;
ALTER TABLE users ADD COLUMN projection_event_seq bigint;
ALTER TABLE users ADD COLUMN projected_at timestamptz;

ALTER TABLE user_groups ADD COLUMN projection_event_id uuid;
ALTER TABLE user_groups ADD COLUMN projection_event_seq bigint;
ALTER TABLE user_groups ADD COLUMN projected_at timestamptz;

ALTER TABLE web_sessions ADD COLUMN projection_event_id uuid;
ALTER TABLE web_sessions ADD COLUMN projection_event_seq bigint;
ALTER TABLE web_sessions ADD COLUMN projected_at timestamptz;

ALTER TABLE chat_sessions ADD COLUMN projection_event_id uuid;
ALTER TABLE chat_sessions ADD COLUMN projection_event_seq bigint;
ALTER TABLE chat_sessions ADD COLUMN projected_at timestamptz;

ALTER TABLE chat_participants ADD COLUMN projection_event_id uuid;
ALTER TABLE chat_participants ADD COLUMN projection_event_seq bigint;
ALTER TABLE chat_participants ADD COLUMN projected_at timestamptz;

ALTER TABLE chat_runs ADD COLUMN projection_event_id uuid;
ALTER TABLE chat_runs ADD COLUMN projection_event_seq bigint;
ALTER TABLE chat_runs ADD COLUMN projected_at timestamptz;

ALTER TABLE chat_messages ADD COLUMN projection_event_id uuid;
ALTER TABLE chat_messages ADD COLUMN projection_event_seq bigint;
ALTER TABLE chat_messages ADD COLUMN projected_at timestamptz;

ALTER TABLE chat_message_events ADD COLUMN projection_event_id uuid;
ALTER TABLE chat_message_events ADD COLUMN projection_event_seq bigint;
ALTER TABLE chat_message_events ADD COLUMN projected_at timestamptz;

ALTER TABLE documents ADD COLUMN projection_event_id uuid;
ALTER TABLE documents ADD COLUMN projection_event_seq bigint;
ALTER TABLE documents ADD COLUMN projected_at timestamptz;

ALTER TABLE document_versions ADD COLUMN projection_event_id uuid;
ALTER TABLE document_versions ADD COLUMN projection_event_seq bigint;
ALTER TABLE document_versions ADD COLUMN projected_at timestamptz;

ALTER TABLE document_acl_entries ADD COLUMN projection_event_id uuid;
ALTER TABLE document_acl_entries ADD COLUMN projection_event_seq bigint;
ALTER TABLE document_acl_entries ADD COLUMN projected_at timestamptz;

ALTER TABLE ingestion_jobs ADD COLUMN projection_event_id uuid;
ALTER TABLE ingestion_jobs ADD COLUMN projection_event_seq bigint;
ALTER TABLE ingestion_jobs ADD COLUMN projected_at timestamptz;

ALTER TABLE ws_tickets ADD COLUMN projection_event_id uuid;
ALTER TABLE ws_tickets ADD COLUMN projection_event_seq bigint;
ALTER TABLE ws_tickets ADD COLUMN projected_at timestamptz;

ALTER TABLE user_import_jobs ADD COLUMN projection_event_id uuid;
ALTER TABLE user_import_jobs ADD COLUMN projection_event_seq bigint;
ALTER TABLE user_import_jobs ADD COLUMN projected_at timestamptz;

ALTER TABLE user_import_rows ADD COLUMN projection_event_id uuid;
ALTER TABLE user_import_rows ADD COLUMN projection_event_seq bigint;
ALTER TABLE user_import_rows ADD COLUMN projected_at timestamptz;

ALTER TABLE evaluation_datasets ADD COLUMN projection_event_id uuid;
ALTER TABLE evaluation_datasets ADD COLUMN projection_event_seq bigint;
ALTER TABLE evaluation_datasets ADD COLUMN projected_at timestamptz;

ALTER TABLE evaluation_runs ADD COLUMN projection_event_id uuid;
ALTER TABLE evaluation_runs ADD COLUMN projection_event_seq bigint;
ALTER TABLE evaluation_runs ADD COLUMN projected_at timestamptz;

ALTER TABLE evaluation_run_items ADD COLUMN projection_event_id uuid;
ALTER TABLE evaluation_run_items ADD COLUMN projection_event_seq bigint;
ALTER TABLE evaluation_run_items ADD COLUMN projected_at timestamptz;

ALTER TABLE llm_models ADD COLUMN projection_event_id uuid;
ALTER TABLE llm_models ADD COLUMN projection_event_seq bigint;
ALTER TABLE llm_models ADD COLUMN projected_at timestamptz;

ALTER TABLE bm25_search_documents ADD COLUMN projection_event_id uuid;
ALTER TABLE bm25_search_documents ADD COLUMN projection_event_seq bigint;
ALTER TABLE bm25_search_documents ADD COLUMN projected_at timestamptz;

ALTER TABLE bm25_postings ADD COLUMN projection_event_id uuid;
ALTER TABLE bm25_postings ADD COLUMN projection_event_seq bigint;
ALTER TABLE bm25_postings ADD COLUMN projected_at timestamptz;

ALTER TABLE bm25_term_stats ADD COLUMN projection_event_id uuid;
ALTER TABLE bm25_term_stats ADD COLUMN projection_event_seq bigint;
ALTER TABLE bm25_term_stats ADD COLUMN projected_at timestamptz;

ALTER TABLE bm25_field_stats ADD COLUMN projection_event_id uuid;
ALTER TABLE bm25_field_stats ADD COLUMN projection_event_seq bigint;
ALTER TABLE bm25_field_stats ADD COLUMN projected_at timestamptz;

ALTER TABLE event_delivery_logs ADD COLUMN projection_event_id uuid;
ALTER TABLE event_delivery_logs ADD COLUMN projection_event_seq bigint;
ALTER TABLE event_delivery_logs ADD COLUMN projected_at timestamptz;

ALTER TABLE agent_tools ADD COLUMN projection_event_id uuid;
ALTER TABLE agent_tools ADD COLUMN projection_event_seq bigint;
ALTER TABLE agent_tools ADD COLUMN projected_at timestamptz;

ALTER TABLE published_artifacts ADD COLUMN projection_event_id uuid;
ALTER TABLE published_artifacts ADD COLUMN projection_event_seq bigint;
ALTER TABLE published_artifacts ADD COLUMN projected_at timestamptz;

ALTER TABLE tool_invocations ADD COLUMN projection_event_id uuid;
ALTER TABLE tool_invocations ADD COLUMN projection_event_seq bigint;
ALTER TABLE tool_invocations ADD COLUMN projected_at timestamptz;

ALTER TABLE test_report_runs ADD COLUMN projection_event_id uuid;
ALTER TABLE test_report_runs ADD COLUMN projection_event_seq bigint;
ALTER TABLE test_report_runs ADD COLUMN projected_at timestamptz;
