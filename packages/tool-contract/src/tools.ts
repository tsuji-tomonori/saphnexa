export type ToolMethod = "POST";
export type ToolAuth = "agentcore-gateway-outbound";

export const toolNames = [
  "kb-retrieve",
  "bm25-search",
  "acl-check",
  "reference-expand",
  "evidence-pack",
  "citation-format"
] as const;

export type ToolName = (typeof toolNames)[number];

export const toolOperationIds = [
  "kbRetrieve",
  "bm25Search",
  "aclCheck",
  "referenceExpand",
  "evidencePack",
  "citationFormat"
] as const;

export type ToolOperationId = (typeof toolOperationIds)[number];

export interface ToolContract {
  toolName: ToolName;
  operationId: ToolOperationId;
  method: ToolMethod;
  path: `/v1/tools/${string}`;
  requestSchema: string;
  responseSchema: string;
  auth: ToolAuth;
  csrfRequired: false;
  scope: string;
  timeoutMs: number;
  auditTable: "tool_invocations";
  successStatuses: [200];
  errorStatuses: number[];
}

export const toolErrorStatuses = [400, 401, 403, 500] as const;

export const toolContracts = [
  tool("kb-retrieve", "kbRetrieve", "/v1/tools/kb-retrieve", "KbRetrieveToolRequest", "KbRetrieveToolResponse", "bedrock-kb-retrieve", 10000),
  tool("bm25-search", "bm25Search", "/v1/tools/bm25-search", "Bm25SearchToolRequest", "Bm25SearchToolResponse", "bm25f-read", 5000),
  tool("acl-check", "aclCheck", "/v1/tools/acl-check", "AclCheckToolRequest", "AclCheckToolResponse", "document-acl-read", 3000),
  tool("reference-expand", "referenceExpand", "/v1/tools/reference-expand", "ReferenceExpandToolRequest", "ReferenceExpandToolResponse", "reference-graph-read", 3000),
  tool("evidence-pack", "evidencePack", "/v1/tools/evidence-pack", "EvidencePackToolRequest", "EvidencePackToolResponse", "evidence-pack", 5000),
  tool("citation-format", "citationFormat", "/v1/tools/citation-format", "CitationFormatToolRequest", "CitationFormatToolResponse", "citation-write", 5000)
] satisfies ToolContract[];

function tool(
  toolName: ToolName,
  operationId: ToolOperationId,
  path: `/v1/tools/${string}`,
  requestSchema: string,
  responseSchema: string,
  scope: string,
  timeoutMs: number
): ToolContract {
  return {
    toolName,
    operationId,
    method: "POST",
    path,
    requestSchema,
    responseSchema,
    auth: "agentcore-gateway-outbound",
    csrfRequired: false,
    scope,
    timeoutMs,
    auditTable: "tool_invocations",
    successStatuses: [200],
    errorStatuses: [...toolErrorStatuses]
  };
}
