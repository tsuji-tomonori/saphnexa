import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createLocalTools, type LocalRagTools, type ToolInvocationStore } from "@saphnexa/rag-core";
import { toolContracts, type ToolOperationId } from "@saphnexa/tool-contract";

export interface ToolsApiOptions {
  store: ToolInvocationStore;
}

const RetrievalPolicy = z.object({
  top_k: z.number().int().positive().max(50).optional(),
  allowed_acl_scope_ids: z.array(z.string().min(1)).optional()
});

const RagChunk = z.object({
  chunk_id: z.string().min(1),
  document_id: z.string().min(1),
  version_id: z.string().min(1),
  document_name: z.string().min(1),
  version_label: z.string().min(1),
  page: z.number().int().positive(),
  section: z.string().min(1),
  acl_scope_id: z.string().min(1),
  text: z.string().min(1),
  score: z.number().optional(),
  node_id: z.string().optional()
});

const Evidence = z.object({
  evidence_id: z.string().min(1),
  chunk_id: z.string().min(1),
  document_id: z.string().min(1),
  version_id: z.string().min(1),
  document_name: z.string().min(1),
  version_label: z.string().min(1),
  page: z.number().int().positive(),
  section: z.string().min(1),
  text: z.string().min(1)
});

const Citation = z.object({
  citation_id: z.string().min(1),
  document_id: z.string().min(1),
  version_id: z.string().min(1),
  chunk_id: z.string().min(1),
  display: z.object({
    document_name: z.string().min(1),
    version_label: z.string().min(1),
    page: z.number().int().positive(),
    section: z.string().min(1)
  })
});

const toolSchemas = {
  kbRetrieve: {
    request: z.object({
      run_id: z.string().min(1),
      query: z.string().min(1),
      retrieval_policy: RetrievalPolicy.optional()
    }).openapi("KbRetrieveToolRequest"),
    response: z.object({
      results: z.array(RagChunk)
    }).openapi("KbRetrieveToolResponse")
  },
  bm25Search: {
    request: z.object({
      run_id: z.string().min(1),
      query: z.string().min(1),
      retrieval_policy: RetrievalPolicy.optional()
    }).openapi("Bm25SearchToolRequest"),
    response: z.object({
      results: z.array(z.object({
        doc_id: z.string().min(1),
        source_chunk_id: z.string().min(1),
        score: z.number(),
        title: z.string().min(1)
      }))
    }).openapi("Bm25SearchToolResponse")
  },
  aclCheck: {
    request: z.object({
      run_id: z.string().min(1),
      user_id: z.string().min(1),
      candidates: z.array(RagChunk)
    }).openapi("AclCheckToolRequest"),
    response: z.object({
      allowed: z.array(RagChunk),
      denied_count: z.number().int().nonnegative()
    }).openapi("AclCheckToolResponse")
  },
  referenceExpand: {
    request: z.object({
      run_id: z.string().min(1),
      source_nodes: z.array(z.object({
        node_id: z.string().min(1),
        document_id: z.string().min(1)
      })),
      max_hops: z.number().int().min(1).max(3)
    }).openapi("ReferenceExpandToolRequest"),
    response: z.object({
      nodes: z.array(RagChunk),
      edges: z.array(z.object({
        source_node_id: z.string().min(1),
        target_node_id: z.string().min(1),
        edge_type: z.literal("section_reference")
      }))
    }).openapi("ReferenceExpandToolResponse")
  },
  evidencePack: {
    request: z.object({
      run_id: z.string().min(1),
      chunks: z.array(RagChunk),
      token_budget: z.number().int().positive().max(32000)
    }).openapi("EvidencePackToolRequest"),
    response: z.object({
      evidence: z.array(Evidence),
      dropped: z.array(RagChunk)
    }).openapi("EvidencePackToolResponse")
  },
  citationFormat: {
    request: z.object({
      run_id: z.string().min(1),
      answer_text: z.string().min(1),
      evidence: z.array(Evidence)
    }).openapi("CitationFormatToolRequest"),
    response: z.object({
      answer_text: z.string().min(1),
      citations: z.array(Citation)
    }).openapi("CitationFormatToolResponse")
  }
} satisfies Record<ToolOperationId, { request: z.ZodTypeAny; response: z.ZodTypeAny }>;

const ToolError = z.object({
  error_code: z.string(),
  message: z.string().optional(),
  details: z.record(z.unknown()).optional()
});

export function createSaphnexaToolsApiApp(options: ToolsApiOptions) {
  const tools = createLocalTools(options.store);
  const app = new OpenAPIHono();

  app.doc("/openapi.json", {
    openapi: "3.0.3",
    info: {
      title: "Saphnexa Tools API",
      version: "0.1.0"
    }
  });

  for (const contract of toolContracts) {
    const route = createRoute({
      method: "post",
      path: contract.path,
      operationId: contract.operationId,
      request: {
        body: {
          content: {
            "application/json": {
              schema: toolSchemas[contract.operationId].request
            }
          }
        }
      },
      responses: {
        200: {
          description: `${contract.toolName} success`,
          content: { "application/json": { schema: toolSchemas[contract.operationId].response } }
        },
        400: {
          description: `${contract.toolName} invalid request`,
          content: { "application/json": { schema: ToolError } }
        },
        403: {
          description: `${contract.toolName} denied`,
          content: { "application/json": { schema: ToolError } }
        },
        404: {
          description: `${contract.toolName} handler not found`,
          content: { "application/json": { schema: ToolError } }
        },
        500: {
          description: `${contract.toolName} failed`,
          content: { "application/json": { schema: ToolError } }
        }
      }
    });

    app.openapi(route, async (c) => {
      const body = await c.req.json().catch(() => undefined);
      const schemas = toolSchemas[contract.operationId];
      const request = schemas.request.safeParse(body);
      if (!request.success) {
        return c.json({
          error_code: "TOOL_REQUEST_INVALID",
          message: "Tool request payload is invalid.",
          details: request.error.flatten()
        }, 400);
      }

      const handler = tools[contract.operationId as keyof LocalRagTools] as ((input: unknown) => unknown) | undefined;
      if (!handler) return c.json({ error_code: "TOOL_NOT_FOUND", details: { operationId: contract.operationId } }, 404);
      const response = schemas.response.safeParse(handler(request.data));
      if (!response.success) {
        return c.json({
          error_code: "TOOL_RESPONSE_INVALID",
          message: "Tool handler returned a payload outside the response schema.",
          details: response.error.flatten()
        }, 500);
      }
      return c.json(response.data, 200);
    });
  }

  return app;
}

export const toolsApiOperationSchemas = toolSchemas;
