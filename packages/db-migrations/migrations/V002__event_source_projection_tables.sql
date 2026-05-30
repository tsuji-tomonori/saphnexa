-- Domain event source tables for DB design v0.17案B.
-- Existing status/read-model columns remain projections; these append-only tables are the state source of truth.

CREATE TABLE tenant_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE user_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE web_session_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE chat_session_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE chat_participant_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE chat_run_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE document_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE document_version_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE document_acl_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE ingestion_job_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE user_import_job_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE evaluation_run_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE published_artifact_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE tool_invocation_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);

CREATE TABLE test_report_run_events (
  tenant_id varchar(64) NOT NULL,
  event_id uuid NOT NULL,
  aggregate_id varchar(256) NOT NULL,
  aggregate_type varchar(64) NOT NULL,
  event_seq bigint NOT NULL,
  event_name varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_user_id varchar(128),
  correlation_id varchar(128),
  causation_id varchar(128),
  idempotency_key varchar(256),
  payload_json json NOT NULL,
  PRIMARY KEY (tenant_id, aggregate_id, event_seq)
);
