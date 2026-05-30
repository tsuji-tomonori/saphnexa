export const toolImplementationCoverage = {
  kbRetrieve: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  bm25Search: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  aclCheck: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  referenceExpand: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  evidencePack: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned"),
  citationFormat: tool("aggregate", "aggregate", "aggregate", "aggregate", "implemented", "implemented", "planned")
};

function tool(route, schema, usecase, policy, audit, timeout, production) {
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

function hasPlanned(values) {
  return values.includes("planned");
}
