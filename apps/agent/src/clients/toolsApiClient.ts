import type { RetrievalPolicy } from "../schemas/invocation";
import type { Citation, Evidence } from "../schemas/evidence";

export interface RetrievedChunk {
  chunk_id: string;
  document_id: string;
  version_id?: string;
  document_name?: string;
  version_label?: string;
  page?: number;
  section?: string;
  acl_scope_id: string;
  text: string;
  score?: number;
}

export interface ToolsApiClient {
  kbRetrieve(input: { run_id: string; query: string; retrieval_policy: RetrievalPolicy }): Promise<{ results: RetrievedChunk[] }>;
  bm25Search(input: { run_id: string; query: string; retrieval_policy: RetrievalPolicy }): Promise<{ results: unknown[] }>;
  aclCheck(input: { run_id: string; user_id: string; candidates: RetrievedChunk[] }): Promise<{ allowed: RetrievedChunk[]; denied_count: number }>;
  referenceExpand(input: { run_id: string; source_nodes: Array<{ node_id: string; document_id: string }>; max_hops: number }): Promise<{ nodes: RetrievedChunk[]; edges: unknown[] }>;
  evidencePack(input: { run_id: string; chunks: RetrievedChunk[]; token_budget: number }): Promise<{ evidence: Evidence[]; dropped: unknown[] }>;
  citationFormat(input: { run_id: string; answer_text: string; evidence: Evidence[] }): Promise<{ answer_text: string; citations: Citation[] }>;
}

export function createUnavailableToolsApiClient(): ToolsApiClient {
  return {
    async kbRetrieve() {
      return { results: [] };
    },
    async bm25Search() {
      return { results: [] };
    },
    async aclCheck() {
      return { allowed: [], denied_count: 0 };
    },
    async referenceExpand() {
      return { nodes: [], edges: [] };
    },
    async evidencePack() {
      return { evidence: [], dropped: [] };
    },
    async citationFormat(input) {
      return { answer_text: input.answer_text, citations: [] };
    }
  };
}
