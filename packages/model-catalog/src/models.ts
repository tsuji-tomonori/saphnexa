export type ModelProvider = "bedrock";
export type ModelType = "chat" | "judge" | "embedding";
export type ModelStatus = "active" | "inactive";
export type ModelRole = "general_user" | "admin" | "system";

export const catalogVersion = "saphnexa-model-catalog-2026-05-27" as const;

export const modelIds = [
  "logical-chat-default",
  "logical-evaluation-judge",
  "logical-embedding-default"
] as const;

export type ModelId = (typeof modelIds)[number];

export interface LlmModelCatalogEntry {
  tenant_id: "global";
  model_id: ModelId;
  display_name: string;
  provider: ModelProvider;
  model_type: ModelType;
  capability_json: Record<string, boolean | number>;
  status: ModelStatus;
  visible_to_user: boolean;
  allowed_role: ModelRole;
  default_for_task: string;
  catalog_version: typeof catalogVersion;
}

export const llmModels = [
  {
    tenant_id: "global",
    model_id: "logical-chat-default",
    display_name: "Saphnexa Chat Default",
    provider: "bedrock",
    model_type: "chat",
    capability_json: { streaming: true, tool_use: true, max_context_tokens: 200000 },
    status: "active",
    visible_to_user: true,
    allowed_role: "general_user",
    default_for_task: "chat_default",
    catalog_version: catalogVersion
  },
  {
    tenant_id: "global",
    model_id: "logical-evaluation-judge",
    display_name: "Saphnexa Evaluation Judge",
    provider: "bedrock",
    model_type: "judge",
    capability_json: { structured_output: true, max_context_tokens: 200000 },
    status: "active",
    visible_to_user: false,
    allowed_role: "admin",
    default_for_task: "evaluation_judge_default",
    catalog_version: catalogVersion
  },
  {
    tenant_id: "global",
    model_id: "logical-embedding-default",
    display_name: "Saphnexa Embedding Default",
    provider: "bedrock",
    model_type: "embedding",
    capability_json: { dimensions: 1024 },
    status: "active",
    visible_to_user: false,
    allowed_role: "system",
    default_for_task: "embedding_default",
    catalog_version: catalogVersion
  }
] satisfies LlmModelCatalogEntry[];
