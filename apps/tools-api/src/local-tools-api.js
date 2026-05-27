import { createLocalTools } from "../../../packages/rag-core/src/fixture-rag.js";

export function createLocalToolsApi(store) {
  const tools = createLocalTools(store);
  return {
    post(path, body) {
      switch (path) {
        case "/v1/tools/kb-retrieve":
          return { status: 200, body: tools.kbRetrieve(body) };
        case "/v1/tools/bm25-search":
          return { status: 200, body: tools.bm25Search(body) };
        case "/v1/tools/acl-check":
          return { status: 200, body: tools.aclCheck(body) };
        case "/v1/tools/reference-expand":
          return { status: 200, body: tools.referenceExpand(body) };
        case "/v1/tools/evidence-pack":
          return { status: 200, body: tools.evidencePack(body) };
        case "/v1/tools/citation-format":
          return { status: 200, body: tools.citationFormat(body) };
        default:
          return { status: 404, body: { error_code: "TOOL_NOT_FOUND" } };
      }
    },
    tools
  };
}
