import type { ToolOperationId } from "./tools";

export type ToolImplementationCoverageStatus = "implemented" | "aggregate" | "planned" | "not_required" | "present";

export interface ToolImplementationCoverage {
  route: ToolImplementationCoverageStatus;
  schema: ToolImplementationCoverageStatus;
  usecase: ToolImplementationCoverageStatus;
  policy: ToolImplementationCoverageStatus;
  requestValidation: ToolImplementationCoverageStatus;
  responseValidation: ToolImplementationCoverageStatus;
  audit: ToolImplementationCoverageStatus;
  timeout: ToolImplementationCoverageStatus;
  production: ToolImplementationCoverageStatus;
  unitTest: ToolImplementationCoverageStatus;
  explicitPlannedMarker: "present" | "not_required";
}

export const toolImplementationCoverage = {
  kbRetrieve: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  bm25Search: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  aclCheck: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  referenceExpand: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  evidencePack: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  citationFormat: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned")
} satisfies Record<ToolOperationId, ToolImplementationCoverage>;

function tool(
  route: ToolImplementationCoverageStatus,
  schema: ToolImplementationCoverageStatus,
  usecase: ToolImplementationCoverageStatus,
  policy: ToolImplementationCoverageStatus,
  audit: ToolImplementationCoverageStatus,
  timeout: ToolImplementationCoverageStatus,
  production: ToolImplementationCoverageStatus
): ToolImplementationCoverage {
  const unitTest = "planned";
  return {
    route,
    schema,
    usecase,
    policy,
    requestValidation: schema,
    responseValidation: schema,
    audit,
    timeout,
    production,
    unitTest,
    explicitPlannedMarker: hasPlanned([route, schema, usecase, policy, audit, timeout, production, unitTest]) ? "present" : "not_required"
  };
}

function hasPlanned(values: ToolImplementationCoverageStatus[]) {
  return values.includes("planned");
}
