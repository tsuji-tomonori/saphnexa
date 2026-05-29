export type Chat = { chat_id: string; title: string; status: string };
export type EventRow = { event_seq: number; event_name: string; event_type: string; payload_json: Record<string, unknown> };
export type Artifact = { artifact_id: string; artifact_type: string; title: string; viewer_path: string; status: string };
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
