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
