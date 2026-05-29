import { createHash } from "node:crypto";

export interface RetrievalPolicy {
  top_k?: number;
  allowed_acl_scope_ids?: string[];
}

export interface RagActor {
  user_id: string;
  tenant_id: string;
}

export interface RagRun {
  run_id: string;
  chat_id?: string;
  message_id?: string;
  retrieval_policy_json?: RetrievalPolicy;
}

export interface RagChunk {
  chunk_id: string;
  document_id: string;
  version_id: string;
  document_name: string;
  version_label: string;
  page: number;
  section: string;
  acl_scope_id: string;
  text: string;
  score?: number;
  node_id?: string;
}

export interface RagEvidence {
  evidence_id: string;
  chunk_id: string;
  document_id: string;
  version_id: string;
  document_name: string;
  version_label: string;
  page: number;
  section: string;
  text: string;
}

export interface RagCitation {
  citation_id: string;
  document_id: string;
  version_id: string;
  chunk_id: string;
  display: {
    document_name: string;
    version_label: string;
    page: number;
    section: string;
  };
}

export interface ToolInvocationStore {
  tool_invocations: Array<{
    tenant_id: string;
    invocation_id: string;
    run_id: string;
    chat_id: string | null;
    message_id: string | null;
    tool_name: string;
    request_hash: string;
    response_summary_json: Record<string, unknown>;
    status: "succeeded";
    latency_ms: number;
    error_code: string | null;
    error_message: string | null;
    created_at: string;
    completed_at: string;
  }>;
}

export interface LocalRagTools {
  kbRetrieve(input: { run_id: string; query: string; retrieval_policy?: RetrievalPolicy }): { results: RagChunk[] };
  bm25Search(input: { run_id: string; query: string }): { results: Array<{ doc_id: string; source_chunk_id: string; score: number; title: string }> };
  aclCheck(input: { run_id: string; user_id: string; candidates: RagChunk[] }): { allowed: RagChunk[]; denied_count: number };
  referenceExpand(input: { run_id: string; source_nodes: Array<{ node_id: string; document_id: string }>; max_hops: number }): {
    nodes: RagChunk[];
    edges: Array<{ source_node_id: string; target_node_id: string; edge_type: "section_reference" }>;
  };
  evidencePack(input: { run_id: string; chunks: RagChunk[]; token_budget: number }): { evidence: RagEvidence[]; dropped: RagChunk[] };
  citationFormat(input: { run_id: string; answer_text: string; evidence: RagEvidence[] }): { citations: RagCitation[]; answer_text: string };
}

export interface FixtureRagAnswer {
  refusal: boolean;
  answer_text: string;
  citations: RagCitation[];
  retrieved_count: number;
  allowed_count: number;
  denied_count: number;
  policy_violation?: boolean;
}

const localEvidence: RagChunk[] = [
  {
    chunk_id: "chunk-design-001",
    document_id: "doc-design",
    version_id: "ver-design-016",
    document_name: "Saphnexa 基本設計書",
    version_label: "v0.16",
    page: 1,
    section: "1.1",
    acl_scope_id: "user:user-owner",
    text: "Saphnexa は社内文書を対象に根拠付き回答を返す RAG システムである。",
    score: 0.92
  },
  {
    chunk_id: "chunk-acl-denied",
    document_id: "doc-secret",
    version_id: "ver-secret-001",
    document_name: "権限外文書",
    version_label: "v1",
    page: 9,
    section: "secret",
    acl_scope_id: "group:restricted",
    text: "権限外の検索結果は Evidence へ入れてはならない。",
    score: 0.88
  }
];

export function createFixtureRagAdapter(tools: LocalRagTools) {
  return {
    answer(input: { question: string; actor: RagActor; run: RagRun }): FixtureRagAnswer {
      const { question, actor, run } = input;
      if (isPromptInjectionAttempt(question)) {
        return {
          refusal: true,
          answer_text: "安全上の理由により、システム指示またはツール制約の変更を求める内容には対応できません。",
          citations: [],
          retrieved_count: 0,
          allowed_count: 0,
          denied_count: 0,
          policy_violation: false
        };
      }
      const retrievalInput: { run_id: string; query: string; retrieval_policy?: RetrievalPolicy } = {
        run_id: run.run_id,
        query: question
      };
      if (run.retrieval_policy_json) retrievalInput.retrieval_policy = run.retrieval_policy_json;
      const retrieved = tools.kbRetrieve(retrievalInput).results;
      const acl = tools.aclCheck({ run_id: run.run_id, user_id: actor.user_id, candidates: retrieved });
      const expanded = tools.referenceExpand({
        run_id: run.run_id,
        source_nodes: acl.allowed.map((item) => ({ node_id: item.chunk_id, document_id: item.document_id })),
        max_hops: 1
      });
      const evidence = tools.evidencePack({
        run_id: run.run_id,
        chunks: acl.allowed.concat(expanded.nodes.map((node) => ({ ...node, score: 0.5 }))),
        token_budget: 1800
      }).evidence;

      if (question.includes("根拠なし") || question.includes("unanswerable") || evidence.length === 0) {
        return {
          refusal: true,
          answer_text: "参照可能な資料内に回答の根拠が見つからないため、回答できません。",
          citations: [],
          retrieved_count: retrieved.length,
          allowed_count: acl.allowed.length,
          denied_count: acl.denied_count
        };
      }

      const answerText = "Saphnexa は、文書取り込み、ACL 確認、検索後の根拠整形、引用表示を含む RAG システムです。";
      const formatted = tools.citationFormat({
        run_id: run.run_id,
        answer_text: answerText,
        evidence
      });
      return {
        refusal: false,
        answer_text: formatted.answer_text,
        citations: formatted.citations,
        retrieved_count: retrieved.length,
        allowed_count: acl.allowed.length,
        denied_count: acl.denied_count
      };
    }
  };
}

export function isPromptInjectionAttempt(question: string) {
  const normalized = question.toLowerCase();
  return [
    "ignore previous",
    "ignore all previous",
    "system prompt",
    "developer message",
    "tool policy",
    "bypass acl",
    "disable citation",
    "指示を無視",
    "システムプロンプト",
    "aclを無視",
    "引用を外"
  ].some((token) => normalized.includes(token));
}

export function createLocalTools(store: ToolInvocationStore): LocalRagTools {
  return {
    kbRetrieve(input) {
      recordTool(store, "kb-retrieve", input, { count: localEvidence.length });
      const allowedScopes = new Set(input.retrieval_policy?.allowed_acl_scope_ids || []);
      const filtered = localEvidence.filter((item) => allowedScopes.size === 0 || allowedScopes.has(item.acl_scope_id) || item.chunk_id === "chunk-acl-denied");
      return { results: filtered.slice(0, input.retrieval_policy?.top_k || 10) };
    },
    bm25Search(input) {
      recordTool(store, "bm25-search", input, { count: 1 });
      return { results: [{ doc_id: "bm25-doc-local", source_chunk_id: "chunk-design-001", score: 0.81, title: "Saphnexa 基本設計書" }] };
    },
    aclCheck(input) {
      const allowed = input.candidates.filter((item) => item.acl_scope_id === `user:${input.user_id}` || item.acl_scope_id === "group:public");
      recordTool(store, "acl-check", input, { allowed: allowed.length, denied_count: input.candidates.length - allowed.length });
      return { allowed, denied_count: input.candidates.length - allowed.length };
    },
    referenceExpand(input) {
      recordTool(store, "reference-expand", input, { nodes: input.source_nodes.length });
      return {
        nodes: input.source_nodes.map((node) => ({
          chunk_id: `${node.node_id}-ref`,
          document_id: node.document_id,
          version_id: "ver-design-016",
          document_name: "Saphnexa 基本設計書",
          version_label: "v0.16",
          page: 1,
          section: "1.2",
          acl_scope_id: "user:user-owner",
          text: "名称は sapience と nexus に由来する。",
          node_id: `${node.node_id}-ref`
        })),
        edges: input.source_nodes.map((node) => ({ source_node_id: node.node_id, target_node_id: `${node.node_id}-ref`, edge_type: "section_reference" }))
      };
    },
    evidencePack(input) {
      const evidence = input.chunks.slice(0, Math.max(1, Math.floor(input.token_budget / 900))).map((chunk, index) => ({
        evidence_id: `evidence-${index + 1}`,
        chunk_id: chunk.chunk_id,
        document_id: chunk.document_id,
        version_id: chunk.version_id,
        document_name: chunk.document_name,
        version_label: chunk.version_label,
        page: chunk.page,
        section: chunk.section,
        text: chunk.text
      }));
      recordTool(store, "evidence-pack", input, { evidence: evidence.length, dropped: input.chunks.length - evidence.length });
      return { evidence, dropped: [] };
    },
    citationFormat(input) {
      const citations = input.evidence.map((item, index) => ({
        citation_id: `cite-${input.run_id}-${index + 1}`,
        document_id: item.document_id,
        version_id: item.version_id,
        chunk_id: item.chunk_id,
        display: {
          document_name: item.document_name,
          version_label: item.version_label,
          page: item.page,
          section: item.section
        }
      }));
      recordTool(store, "citation-format", input, { citations: citations.length });
      return {
        citations,
        answer_text: `${input.answer_text} [${citations.map((item) => item.citation_id).join(", ")}]`
      };
    }
  };
}

function recordTool(store: ToolInvocationStore, tool_name: string, request: { run_id: string } & Record<string, unknown>, responseSummary: Record<string, unknown>) {
  store.tool_invocations.push({
    tenant_id: "tenant-local",
    invocation_id: `tool-${store.tool_invocations.length + 1}`,
    run_id: request.run_id,
    chat_id: null,
    message_id: null,
    tool_name,
    request_hash: createHash("sha256").update(JSON.stringify(redact(request))).digest("hex"),
    response_summary_json: responseSummary,
    status: "succeeded",
    latency_ms: 1,
    error_code: null,
    error_message: null,
    created_at: "2026-05-27T00:00:00.000Z",
    completed_at: "2026-05-27T00:00:00.000Z"
  });
}

function redact(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);
  return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, key.includes("text") ? "<redacted>" : redact(inner)]));
}
