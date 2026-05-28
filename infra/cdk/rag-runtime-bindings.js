import { toolContracts } from "../../packages/tool-contract/src/tools.js";

export const ragRuntimeBindings = {
  embedding: {
    modelId: "amazon.titan-embed-text-v2:0",
    dimension: 1536,
    dataType: "float32"
  },
  s3Vectors: {
    bucketLogicalId: "S3VectorBucket",
    indexLogicalId: "S3VectorIndex",
    indexNameSuffix: "documents",
    distanceMetric: "cosine",
    metadataFields: ["tenant_id", "document_id", "version_id", "acl_scope_id", "source_s3_uri", "page", "section"]
  },
  knowledgeBase: {
    logicalId: "BedrockKnowledgeBase",
    storageType: "S3_VECTORS",
    textField: "text",
    metadataField: "metadata",
    vectorField: "vector",
    aclFilterFields: ["tenant_id", "acl_scope_id", "document_id", "version_id"],
    retrieveTool: "kb-retrieve"
  },
  dataSource: {
    logicalId: "BedrockDataSource",
    sourceBucket: "RawDocumentsBucket",
    inclusionPrefixes: ["documents/active/"],
    customTransformationLambda: "IngestionWorkerLambda",
    parsingStrategy: "BEDROCK_DATA_AUTOMATION"
  },
  agentCore: {
    runtimeLogicalId: "AgentCoreRuntime",
    gatewayLogicalId: "AgentCoreGateway",
    gatewayTargetLogicalId: "AgentCoreToolsGatewayTarget",
    protocol: "MCP",
    authorizerType: "AWS_IAM",
    runtimeProtocol: "HTTP",
    toolsApiBasePath: "/v1/tools",
    aclPrecheckEnabled: true,
    tools: toolContracts.map((tool) => ({
      toolName: tool.toolName,
      path: tool.path,
      operationId: tool.operationId,
      scope: tool.scope,
      timeoutMs: tool.timeoutMs
    }))
  },
  queues: {
    ingestion: { logicalId: "IngestionQueue", dlqLogicalId: "IngestionDlq", visibilityTimeoutSeconds: 960, maxReceiveCount: 3 },
    evaluation: { logicalId: "EvaluationQueue", dlqLogicalId: "EvaluationDlq", visibilityTimeoutSeconds: 960, maxReceiveCount: 3 }
  }
};
