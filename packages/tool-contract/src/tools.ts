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
