export type Chat = { chat_id: string; title: string; status: string };
export type ChatParticipant = { user_id: string; participant_role: "owner" | "viewer"; status: string; added_by_user_id: string; added_at: string; removed_at?: string | null };
export type ChatMessage = { message_id: string; parent_message_id?: string | null; sender_user_id?: string | null; sender_type: "general_user" | "admin" | "assistant"; content_text: string; run_id?: string | null; status: string; created_at: string; completed_at?: string | null };
export type EventRow = { event_seq: number; event_name: string; event_type: string; payload_json: Record<string, unknown> };
export type Favorite = { favorite_id: string; user_id: string; chat_id?: string | null; message_id?: string | null; created_at: string };
export type MessageFeedback = { feedback_id: string; user_id: string; chat_id?: string | null; message_id?: string | null; rating?: string; comment?: string | null; problem_type?: string | null; created_at: string };
export type Artifact = { artifact_id: string; artifact_type: string; title: string; viewer_path: string; status: string };
export type AdminUser = { user_id: string; email: string; display_name: string; role: string; status: string };
export type AdminDocument = { document_id: string; title: string; status: string; created_by_user_id: string; updated_at: string };
export type DocumentVersion = { document_id: string; version_id: string; version_label: string; status: string; raw_s3_uri: string; created_at: string };
export type DocumentAclEntry = { document_id: string; version_id: string; acl_scope_id: string; effect: string };
export type IngestionJob = { job_id: string; document_id: string; version_id: string; status: string; raw_s3_uri: string; parsed_s3_prefix: string; error_code?: string | null; retryable: boolean };
export type AdminDocumentDetail = AdminDocument & { versions: DocumentVersion[]; ingestion_jobs: IngestionJob[]; acl_entries: DocumentAclEntry[] };
export type UserImportJob = { import_id: string; status: string; result_s3_prefix: string; result_report_json: { created: number; updated: number; deleted: number; failed: number; error_rows_s3_uri: string } };
export type UserImportRow = { row_number: number; action: string; status: string; target_user_id?: string | null; error_message?: string | null };
export type Citation = {
  citation_id: string;
  document_id: string;
  version_id: string;
  chunk_id?: string;
  display?: {
    document_name?: string;
    version_label?: string;
    page?: number;
    section?: string;
  };
};
