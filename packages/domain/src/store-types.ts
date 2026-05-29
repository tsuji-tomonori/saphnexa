import type { AdminEventName, ChatEventName, ParticipantRole, Role, Status } from "./index";

export interface LocalActor {
  tenant_id: string;
  user_id: string;
  role: Role;
  status: Status;
}

export interface LocalTenant {
  tenant_id: string;
  tenant_name: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface LocalUser extends LocalActor {
  email: string;
  display_name: string;
}

export interface ChatSession {
  tenant_id: string;
  chat_id: string;
  title: string;
  status: Status;
  last_message_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ChatParticipant {
  tenant_id: string;
  chat_id: string;
  user_id: string;
  participant_role: ParticipantRole;
  status: Status;
  added_by_user_id: string;
  added_at: string;
  removed_at: string | null;
}

export interface ChatMessage {
  tenant_id: string;
  chat_id: string;
  message_id: string;
  parent_message_id: string | null;
  sender_user_id: string | null;
  sender_type: Role | "assistant";
  content_text: string;
  run_id: string | null;
  status: Status;
  created_at: string;
  completed_at: string | null;
}

export interface RetrievalPolicyJson {
  top_k: number;
  allowed_acl_scope_ids: string[];
}

export interface ChatRun {
  tenant_id: string;
  run_id: string;
  chat_id: string;
  message_id: string;
  requested_by_user_id: string;
  retrieval_policy_json: RetrievalPolicyJson;
  model_id: string;
  prompt_version: string;
  failure_injection: string | null;
  status: Status;
  started_at: string | null;
  completed_at: string | null;
  error_code: string | null;
  retryable: boolean;
}

export interface ChatMessageEvent {
  tenant_id: string;
  chat_id: string;
  message_id: string;
  event_seq: number;
  event_id: string;
  event_name: ChatEventName;
  event_type: "progress" | "partial" | "final" | "error";
  payload_json: Record<string, unknown>;
  created_at: string;
}

export interface CitationRecord {
  tenant_id: string;
  chat_id: string;
  message_id: string;
  citation_id: string;
  document_id: string;
  version_id: string;
  chunk_id: string;
  display: string;
}

export interface DocumentRecord {
  tenant_id: string;
  document_id: string;
  title: string;
  status: Status;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  tenant_id: string;
  document_id: string;
  version_id: string;
  version_label: string;
  status: Status | "uploaded";
  raw_s3_uri: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface DocumentAclEntry {
  tenant_id: string;
  document_id: string;
  version_id: string;
  acl_scope_id: string;
  effect: "allow" | "deny";
}

export interface IngestionJob {
  tenant_id: string;
  job_id: string;
  document_id: string;
  version_id: string;
  status: Status;
  raw_s3_uri: string;
  parsed_s3_prefix: string;
  error_code: string | null;
  retryable: boolean;
}

export interface AdminEvent {
  tenant_id: string;
  event_id: string;
  event_name: AdminEventName;
  payload_json: Record<string, unknown>;
  created_at: string;
}

export interface AuditEvent {
  tenant_id: string;
  event_id: string;
  action_name: string;
  resource_type: string;
  resource_id: string;
  actor_user_id: string;
  payload_json: Record<string, unknown>;
  created_at: string;
}

export interface WsTicket {
  tenant_id: string;
  ticket_id: string;
  user_id: string;
  channel_scope_json: { channels: string[] };
  status: Status | "used";
  issued_at_ms: number;
  expires_at_ms: number;
  used_at_ms: number | null;
}

export interface EvaluationDataset {
  tenant_id: string;
  dataset_id: string;
  dataset_name: string;
  status: Status;
  source_s3_uri: string;
  created_at: string;
}

export interface EvaluationRun {
  tenant_id: string;
  evaluation_run_id: string;
  dataset_id: string;
  model_id: string;
  prompt_version: string;
  retrieval_config_json: Record<string, unknown>;
  artifact_s3_prefix: string;
  status: Status;
  metrics_json: Record<string, unknown>;
  created_by_user_id: string;
}

export interface PublishedArtifact {
  artifact_id: string;
  artifact_type: "design_doc_html" | "allure_report";
  title: string;
  viewer_path: string;
  manifest_path: string;
}

export interface ToolInvocationRecord {
  tenant_id?: string;
  invocation_id: string;
  run_id: string;
  tool_name: string;
  status: string;
  input_json?: Record<string, unknown>;
  output_json?: Record<string, unknown>;
}

export interface LocalDomainState {
  counters: Map<string, number>;
  tenants: LocalTenant[];
  users: LocalUser[];
  chat_sessions: ChatSession[];
  chat_participants: ChatParticipant[];
  chat_messages: ChatMessage[];
  chat_runs: ChatRun[];
  chat_message_events: ChatMessageEvent[];
  citation_records: CitationRecord[];
  message_feedback: Array<Record<string, unknown>>;
  favorites: Array<Record<string, unknown>>;
  documents: DocumentRecord[];
  document_versions: DocumentVersion[];
  document_acl_entries: DocumentAclEntry[];
  ingestion_jobs: IngestionJob[];
  admin_events: AdminEvent[];
  audit_events: AuditEvent[];
  ws_tickets: WsTicket[];
  user_import_jobs: Array<Record<string, unknown>>;
  user_import_rows: Array<Record<string, unknown>>;
  evaluation_datasets: EvaluationDataset[];
  evaluation_runs: EvaluationRun[];
  published_artifacts: PublishedArtifact[];
  tool_invocations: ToolInvocationRecord[];
}

export interface RagAdapter {
  answer(input: {
    question: string;
    actor: LocalActor;
    run: ChatRun;
    store: LocalDomainState;
  }): {
    answer_text: string;
    retrieved_count: number;
    allowed_count: number;
    denied_count: number;
    refusal: boolean;
    citations: CitationRecord[];
  };
}

export interface LocalStore {
  state: LocalDomainState;
  getCurrentUser(user_id: string): LocalUser | undefined;
  createChat(actor: LocalActor, input?: { title?: string }): ChatSession;
  addParticipant(actor: LocalActor, chat_id: string, input: { user_id: string }): ChatParticipant;
  updateParticipant(actor: LocalActor, chat_id: string, user_id: string, input?: { participant_role?: ParticipantRole }): ChatParticipant;
  removeParticipant(actor: LocalActor, chat_id: string, user_id: string): boolean;
  listChats(actor: LocalActor): ChatSession[];
  getChat(actor: LocalActor, chat_id: string): ChatSession & { participants: ChatParticipant[]; messages: ChatMessage[] };
  submitQuestion(actor: LocalActor, chat_id: string, input: { question: string; retrieval_policy?: RetrievalPolicyJson; model_id?: string; failure_injection?: string }, ragAdapter?: RagAdapter): { message_id: string; run_id: string; status: Status };
  listEvents(actor: LocalActor, chat_id: string, message_id: string, after_seq?: number): ChatMessageEvent[];
  listDocuments(actor: LocalActor): DocumentRecord[];
  getDocument(actor: LocalActor, document_id: string): DocumentRecord | undefined;
  getIngestionJob(actor: LocalActor, job_id: string): IngestionJob | undefined;
  issueWsTicket(actor: LocalActor, input?: { now_ms?: number }): { ticket: string; expires_in_seconds: number; channels: string[] };
  consumeWsTicket(actor: LocalActor, ticket_id: string, now_ms?: number): { ticket_id: string; channels: string[]; status: string };
  startEvaluationRun(actor: LocalActor, input?: { dataset_id?: string; model_id?: string }): EvaluationRun;
  listAdminArtifacts(actor: LocalActor): PublishedArtifact[];
}

export declare function createLocalStore(): LocalStore;
