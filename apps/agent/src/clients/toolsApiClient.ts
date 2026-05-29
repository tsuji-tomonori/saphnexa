import type { RetrievalPolicy } from "../schemas/invocation";
import type { Citation, Evidence } from "../schemas/evidence";
import { toolContracts, type ToolOperationId } from "@saphnexa/tool-contract";

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

export interface HttpToolsApiClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

const toolPathByOperation = Object.fromEntries(toolContracts.map((tool) => [tool.operationId, tool.path])) as Record<ToolOperationId, string>;

export function createHttpToolsApiClient(options: HttpToolsApiClientOptions): ToolsApiClient {
  const transport = options.fetch ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  return {
    kbRetrieve(input) {
      return postTool(options, transport, baseUrl, "kbRetrieve", input);
    },
    bm25Search(input) {
      return postTool(options, transport, baseUrl, "bm25Search", input);
    },
    aclCheck(input) {
      return postTool(options, transport, baseUrl, "aclCheck", input);
    },
    referenceExpand(input) {
      return postTool(options, transport, baseUrl, "referenceExpand", input);
    },
    evidencePack(input) {
      return postTool(options, transport, baseUrl, "evidencePack", input);
    },
    citationFormat(input) {
      return postTool(options, transport, baseUrl, "citationFormat", input);
    }
  };
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

async function postTool<TRequest, TResponse>(
  options: HttpToolsApiClientOptions,
  transport: typeof fetch,
  baseUrl: string,
  operationId: ToolOperationId,
  input: TRequest
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);
  try {
    const response = await transport(`${baseUrl}${toolPathByOperation[operationId]}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...options.headers
      },
      body: JSON.stringify(input),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw new ToolsApiHttpError(operationId, response.status, payload);
    }
    return payload as TResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export class ToolsApiHttpError extends Error {
  constructor(
    readonly operationId: ToolOperationId,
    readonly status: number,
    readonly payload: unknown
  ) {
    super(`Tools API ${operationId} failed with HTTP ${status}.`);
  }
}
