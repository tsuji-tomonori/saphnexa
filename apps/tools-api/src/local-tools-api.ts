import { createLocalTools, type LocalRagTools, type ToolInvocationStore } from "../../../packages/rag-core/src/fixture-rag";
import { toolContracts, type ToolOperationId } from "../../../packages/tool-contract/src/tools";

type LocalToolHandler = (tools: LocalRagTools, body: any) => unknown;

const toolHandlerByOperation = {
  kbRetrieve: (tools, body) => tools.kbRetrieve(body),
  bm25Search: (tools, body) => tools.bm25Search(body),
  aclCheck: (tools, body) => tools.aclCheck(body),
  referenceExpand: (tools, body) => tools.referenceExpand(body),
  evidencePack: (tools, body) => tools.evidencePack(body),
  citationFormat: (tools, body) => tools.citationFormat(body)
} satisfies Record<ToolOperationId, LocalToolHandler>;

export function createLocalToolsApi(store: ToolInvocationStore) {
  const tools = createLocalTools(store);
  const handlerByPath: Map<string, LocalToolHandler> = new Map(toolContracts.map((contract) => [contract.path, toolHandlerByOperation[contract.operationId]]));

  return {
    post(path: string, body: unknown) {
      const handler = handlerByPath.get(path);
      if (!handler) return { status: 404, body: { error_code: "TOOL_NOT_FOUND" } };
      return { status: 200, body: handler(tools, body) };
    },
    tools
  };
}
