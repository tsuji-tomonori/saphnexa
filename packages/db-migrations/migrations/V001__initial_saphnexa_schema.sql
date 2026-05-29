-- Saphnexa initial schema for Aurora DSQL/Flyway.
-- The migration keeps chat as an independent resource and uses
-- chat_participants as the ownership and sharing boundary.

CREATE TABLE tenants (
  tenant_id varchar(64) PRIMARY KEY,
  tenant_name varchar(256) NOT NULL,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE users (
  tenant_id varchar(64) NOT NULL,
  user_id varchar(128) NOT NULL,
  email varchar(320) NOT NULL,
  display_name varchar(256) NOT NULL,
  role varchar(32) NOT NULL,
  department varchar(128),
  employment_type varchar(64),
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE user_groups (
  tenant_id varchar(64) NOT NULL,
  group_id varchar(128) NOT NULL,
  group_name varchar(256) NOT NULL,
  group_type varchar(64) NOT NULL,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, group_id)
);

CREATE TABLE user_group_memberships (
  tenant_id varchar(64) NOT NULL,
  user_id varchar(128) NOT NULL,
  group_id varchar(128) NOT NULL,
  source varchar(64) NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, user_id, group_id)
);

CREATE TABLE web_sessions (
  tenant_id varchar(64) NOT NULL,
  session_id varchar(128) NOT NULL,
  user_id varchar(128) NOT NULL,
  refresh_token_ref varchar(512) NOT NULL,
  csrf_secret_hash varchar(256) NOT NULL,
  status varchar(32) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, session_id)
);

CREATE TABLE chat_sessions (
  tenant_id varchar(64) NOT NULL,
  chat_id uuid NOT NULL,
  title varchar(512) NOT NULL,
  status varchar(32) NOT NULL,
  last_message_at timestamptz,
  created_by_user_id varchar(128) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz,
  PRIMARY KEY (tenant_id, chat_id)
);

CREATE TABLE chat_participants (
  tenant_id varchar(64) NOT NULL,
  chat_id uuid NOT NULL,
  user_id varchar(128) NOT NULL,
  participant_role varchar(32) NOT NULL CHECK (participant_role IN ('owner', 'viewer')),
  status varchar(32) NOT NULL,
  added_by_user_id varchar(128) NOT NULL,
  added_at timestamptz NOT NULL,
  removed_at timestamptz,
  PRIMARY KEY (tenant_id, chat_id, user_id)
);

CREATE TABLE chat_messages (
  tenant_id varchar(64) NOT NULL,
  chat_id uuid NOT NULL,
  message_id uuid NOT NULL,
  parent_message_id uuid,
  sender_user_id varchar(128),
  sender_type varchar(32) NOT NULL,
  content_text text,
  run_id uuid,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  completed_at timestamptz,
  PRIMARY KEY (tenant_id, chat_id, message_id)
);

CREATE TABLE chat_runs (
  tenant_id varchar(64) NOT NULL,
  run_id uuid NOT NULL,
  chat_id uuid NOT NULL,
  message_id uuid NOT NULL,
  requested_by_user_id varchar(128) NOT NULL,
  retrieval_policy_json json NOT NULL,
  model_id varchar(256) NOT NULL,
  prompt_version varchar(128) NOT NULL,
  status varchar(32) NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  error_code varchar(128),
  PRIMARY KEY (tenant_id, run_id)
);

CREATE TABLE chat_message_events (
  tenant_id varchar(64) NOT NULL,
  chat_id uuid NOT NULL,
  message_id uuid NOT NULL,
  event_seq bigint NOT NULL,
  event_id uuid NOT NULL,
  event_name varchar(128) NOT NULL,
  event_type varchar(64) NOT NULL,
  payload_json json NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, chat_id, message_id, event_seq)
);

CREATE TABLE citation_records (
  tenant_id varchar(64) NOT NULL,
  chat_id uuid NOT NULL,
  message_id uuid NOT NULL,
  citation_id varchar(128) NOT NULL,
  document_id varchar(128) NOT NULL,
  version_id varchar(128) NOT NULL,
  chunk_id varchar(256) NOT NULL,
  display_json json NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, chat_id, message_id, citation_id)
);

CREATE TABLE message_feedback (
  tenant_id varchar(64) NOT NULL,
  feedback_id uuid NOT NULL,
  chat_id uuid NOT NULL,
  message_id uuid NOT NULL,
  user_id varchar(128) NOT NULL,
  rating varchar(32) NOT NULL,
  comment text,
  problem_type varchar(64),
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, chat_id, message_id, user_id)
);

CREATE TABLE favorites (
  tenant_id varchar(64) NOT NULL,
  favorite_id uuid NOT NULL,
  user_id varchar(128) NOT NULL,
  chat_id uuid,
  message_id uuid,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, favorite_id)
);

CREATE TABLE documents (
  tenant_id varchar(64) NOT NULL,
  document_id varchar(128) NOT NULL,
  title varchar(512) NOT NULL,
  status varchar(32) NOT NULL,
  created_by_user_id varchar(128) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, document_id)
);

CREATE TABLE document_versions (
  tenant_id varchar(64) NOT NULL,
  document_id varchar(128) NOT NULL,
  version_id varchar(128) NOT NULL,
  version_label varchar(128) NOT NULL,
  status varchar(32) NOT NULL,
  raw_s3_uri varchar(1024) NOT NULL,
  metadata_json json NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, document_id, version_id)
);

CREATE TABLE document_acl_entries (
  tenant_id varchar(64) NOT NULL,
  document_id varchar(128) NOT NULL,
  version_id varchar(128) NOT NULL,
  acl_scope_id varchar(256) NOT NULL,
  effect varchar(32) NOT NULL,
  PRIMARY KEY (tenant_id, document_id, version_id, acl_scope_id)
);

CREATE TABLE ingestion_jobs (
  tenant_id varchar(64) NOT NULL,
  job_id varchar(128) NOT NULL,
  document_id varchar(128) NOT NULL,
  version_id varchar(128) NOT NULL,
  status varchar(32) NOT NULL,
  raw_s3_uri varchar(1024) NOT NULL,
  parsed_s3_prefix varchar(1024) NOT NULL,
  error_code varchar(128),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, job_id)
);

CREATE TABLE reference_nodes (
  tenant_id varchar(64) NOT NULL,
  node_id varchar(256) NOT NULL,
  document_id varchar(128) NOT NULL,
  version_id varchar(128) NOT NULL,
  node_type varchar(64) NOT NULL,
  title text,
  page_number integer,
  section_label varchar(128),
  chunk_id varchar(256),
  PRIMARY KEY (tenant_id, node_id)
);

CREATE TABLE reference_edges (
  tenant_id varchar(64) NOT NULL,
  source_node_id varchar(256) NOT NULL,
  target_node_id varchar(256) NOT NULL,
  edge_type varchar(64) NOT NULL,
  confidence double precision,
  PRIMARY KEY (tenant_id, source_node_id, target_node_id, edge_type)
);

CREATE TABLE ws_tickets (
  tenant_id varchar(64) NOT NULL,
  ticket_id varchar(128) NOT NULL,
  session_id varchar(128) NOT NULL,
  user_id varchar(128) NOT NULL,
  channel_scope_json json NOT NULL,
  status varchar(32) NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  PRIMARY KEY (tenant_id, ticket_id)
);

CREATE TABLE user_import_jobs (
  tenant_id varchar(64) NOT NULL,
  import_id varchar(128) NOT NULL,
  status varchar(32) NOT NULL,
  result_s3_prefix varchar(1024) NOT NULL,
  created_by_user_id varchar(128) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, import_id)
);

CREATE TABLE user_import_rows (
  tenant_id varchar(64) NOT NULL,
  import_id varchar(128) NOT NULL,
  row_number integer NOT NULL,
  status varchar(32) NOT NULL,
  error_message text,
  PRIMARY KEY (tenant_id, import_id, row_number)
);

CREATE TABLE evaluation_datasets (
  tenant_id varchar(64) NOT NULL,
  dataset_id varchar(128) NOT NULL,
  dataset_name varchar(256) NOT NULL,
  status varchar(32) NOT NULL,
  source_s3_uri varchar(1024) NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, dataset_id)
);

CREATE TABLE evaluation_cases (
  tenant_id varchar(64) NOT NULL,
  case_id uuid NOT NULL,
  dataset_id varchar(128) NOT NULL,
  question text NOT NULL,
  expected_answer text,
  expected_citation_json json,
  answerability varchar(32) NOT NULL,
  PRIMARY KEY (tenant_id, case_id)
);

CREATE TABLE evaluation_runs (
  tenant_id varchar(64) NOT NULL,
  evaluation_run_id varchar(128) NOT NULL,
  dataset_id varchar(128) NOT NULL,
  model_id varchar(256) NOT NULL,
  prompt_version varchar(128) NOT NULL,
  retrieval_config_json json NOT NULL,
  artifact_s3_prefix varchar(1024),
  status varchar(32) NOT NULL,
  metrics_json json,
  created_by_user_id varchar(128) NOT NULL,
  PRIMARY KEY (tenant_id, evaluation_run_id)
);

CREATE TABLE evaluation_run_items (
  tenant_id varchar(64) NOT NULL,
  evaluation_run_id varchar(128) NOT NULL,
  case_id uuid NOT NULL,
  status varchar(32) NOT NULL,
  answer_text text,
  retrieved_context_json json,
  judge_result_json json,
  metrics_json json,
  PRIMARY KEY (tenant_id, evaluation_run_id, case_id)
);

CREATE TABLE llm_models (
  tenant_id varchar(64) NOT NULL,
  model_id varchar(256) NOT NULL,
  display_name varchar(256) NOT NULL,
  provider varchar(64) NOT NULL,
  model_type varchar(64) NOT NULL,
  capability_json json NOT NULL,
  status varchar(32) NOT NULL,
  visible_to_user boolean NOT NULL,
  allowed_role varchar(32),
  default_for_task varchar(64),
  catalog_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, model_id)
);

CREATE TABLE bm25_search_documents (
  tenant_id varchar(64) NOT NULL,
  collection_id uuid NOT NULL,
  doc_id uuid NOT NULL,
  source_chunk_id varchar(256) NOT NULL,
  title text,
  snippet text,
  doc_type varchar(64),
  is_deleted boolean NOT NULL,
  PRIMARY KEY (tenant_id, collection_id, doc_id)
);

CREATE TABLE bm25_postings (
  tenant_id varchar(64) NOT NULL,
  collection_id uuid NOT NULL,
  term_id uuid NOT NULL,
  doc_id uuid NOT NULL,
  field_id smallint NOT NULL,
  tf integer NOT NULL,
  field_len integer NOT NULL,
  PRIMARY KEY (tenant_id, collection_id, term_id, doc_id, field_id)
);

CREATE TABLE bm25_term_stats (
  tenant_id varchar(64) NOT NULL,
  collection_id uuid NOT NULL,
  stats_version uuid NOT NULL,
  term_id uuid NOT NULL,
  df integer NOT NULL,
  idf double precision NOT NULL,
  PRIMARY KEY (tenant_id, collection_id, stats_version, term_id)
);

CREATE TABLE bm25_field_stats (
  tenant_id varchar(64) NOT NULL,
  collection_id uuid NOT NULL,
  stats_version uuid NOT NULL,
  field_id smallint NOT NULL,
  avg_len double precision NOT NULL,
  PRIMARY KEY (tenant_id, collection_id, stats_version, field_id)
);

CREATE TABLE event_delivery_logs (
  tenant_id varchar(64) NOT NULL,
  delivery_id uuid NOT NULL,
  channel_path varchar(512) NOT NULL,
  event_id uuid NOT NULL,
  status varchar(32) NOT NULL,
  attempt_count integer NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, delivery_id)
);

CREATE TABLE audit_events (
  tenant_id varchar(64) NOT NULL,
  audit_event_id uuid NOT NULL,
  actor_user_id varchar(128) NOT NULL,
  event_name varchar(128) NOT NULL,
  category varchar(64) NOT NULL,
  resource_id varchar(256) NOT NULL,
  payload_json json,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, audit_event_id)
);

CREATE TABLE agent_tools (
  tenant_id varchar(64) NOT NULL,
  tool_name varchar(128) NOT NULL,
  display_name varchar(256) NOT NULL,
  description text NOT NULL,
  input_schema_json json NOT NULL,
  output_schema_json json NOT NULL,
  tool_scope varchar(128) NOT NULL,
  side_effect_type varchar(32) NOT NULL,
  timeout_ms integer NOT NULL,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, tool_name)
);

CREATE TABLE tool_invocations (
  tenant_id varchar(64) NOT NULL,
  invocation_id uuid NOT NULL,
  run_id uuid NOT NULL,
  chat_id uuid,
  message_id uuid,
  tool_name varchar(128) NOT NULL,
  request_hash varchar(128) NOT NULL,
  response_summary_json json,
  status varchar(32) NOT NULL,
  latency_ms integer,
  error_code varchar(128),
  error_message text,
  created_at timestamptz NOT NULL,
  completed_at timestamptz,
  PRIMARY KEY (tenant_id, invocation_id)
);

CREATE TABLE published_artifacts (
  tenant_id varchar(64) NOT NULL,
  artifact_id varchar(128) NOT NULL,
  artifact_type varchar(64) NOT NULL,
  title varchar(512) NOT NULL,
  version_label varchar(128),
  source_ref varchar(512),
  s3_bucket varchar(256) NOT NULL,
  s3_prefix varchar(1024) NOT NULL,
  viewer_path varchar(1024) NOT NULL,
  status varchar(32) NOT NULL,
  checksum varchar(128),
  published_by varchar(128) NOT NULL,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, artifact_id)
);

CREATE TABLE test_report_runs (
  tenant_id varchar(64) NOT NULL,
  test_run_id uuid NOT NULL,
  artifact_id varchar(128) NOT NULL,
  workflow_run_id varchar(128),
  commit_sha varchar(64) NOT NULL,
  branch_name varchar(256) NOT NULL,
  environment varchar(32) NOT NULL,
  test_suite varchar(128) NOT NULL,
  status varchar(32) NOT NULL,
  total_count integer NOT NULL,
  passed_count integer NOT NULL,
  failed_count integer NOT NULL,
  skipped_count integer NOT NULL,
  duration_ms integer,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, test_run_id)
);

CREATE TABLE schema_migrations (
  installed_rank integer PRIMARY KEY,
  version varchar(50),
  description varchar(200) NOT NULL,
  type varchar(20) NOT NULL,
  script varchar(1000) NOT NULL,
  checksum integer,
  installed_by varchar(100) NOT NULL,
  installed_on timestamp NOT NULL,
  execution_time integer NOT NULL,
  success boolean NOT NULL
);
