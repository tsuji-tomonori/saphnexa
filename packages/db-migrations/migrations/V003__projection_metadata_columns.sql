-- Projection lineage columns for DB design v0.17案B.
-- These columns record which append-only event produced the current read-model state.

ALTER TABLE tenants ADD COLUMN projection_event_id uuid;
ALTER TABLE tenants ADD COLUMN projection_event_seq bigint;
ALTER TABLE tenants ADD COLUMN projected_at timestamptz;

ALTER TABLE users ADD COLUMN projection_event_id uuid;
ALTER TABLE users ADD COLUMN projection_event_seq bigint;
ALTER TABLE users ADD COLUMN projected_at timestamptz;

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

ALTER TABLE user_import_jobs ADD COLUMN projection_event_id uuid;
ALTER TABLE user_import_jobs ADD COLUMN projection_event_seq bigint;
ALTER TABLE user_import_jobs ADD COLUMN projected_at timestamptz;

ALTER TABLE evaluation_runs ADD COLUMN projection_event_id uuid;
ALTER TABLE evaluation_runs ADD COLUMN projection_event_seq bigint;
ALTER TABLE evaluation_runs ADD COLUMN projected_at timestamptz;

ALTER TABLE published_artifacts ADD COLUMN projection_event_id uuid;
ALTER TABLE published_artifacts ADD COLUMN projection_event_seq bigint;
ALTER TABLE published_artifacts ADD COLUMN projected_at timestamptz;

ALTER TABLE tool_invocations ADD COLUMN projection_event_id uuid;
ALTER TABLE tool_invocations ADD COLUMN projection_event_seq bigint;
ALTER TABLE tool_invocations ADD COLUMN projected_at timestamptz;

ALTER TABLE test_report_runs ADD COLUMN projection_event_id uuid;
ALTER TABLE test_report_runs ADD COLUMN projection_event_seq bigint;
ALTER TABLE test_report_runs ADD COLUMN projected_at timestamptz;
