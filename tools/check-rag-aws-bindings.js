import { readText, assert } from "./lib.js";
import { synthLocalInventory } from "../infra/bin/app.js";
import { ragRuntimeBindings } from "../infra/cdk/rag-runtime-bindings.js";
import { toolContracts } from "../packages/tool-contract/src/tools.js";
import { createLocalApi } from "../apps/api/src/local-api.js";

const source = readText("infra/cdk/saphnexa-stack.ts");
const fixtureRagSource = readText("packages/rag-core/src/fixture-rag.js");
const inventory = synthLocalInventory("uat");
const ragCatalog = inventory.intent_catalog.RagProcessingConstruct;

assert(ragCatalog.ragRuntimeIntent === ragRuntimeBindings, "RAG processing intent must expose runtime binding source");
assert(ragRuntimeBindings.embedding.dimension === 1536, "embedding dimension must match Titan v2 default binding");
assert(ragRuntimeBindings.s3Vectors.distanceMetric === "cosine", "S3 Vectors distance metric must be cosine");
assert(ragRuntimeBindings.knowledgeBase.storageType === "S3_VECTORS", "Bedrock KB must use S3 Vectors storage");
assert(ragRuntimeBindings.agentCore.protocol === "MCP", "AgentCore Gateway must use MCP protocol");
assert(ragRuntimeBindings.agentCore.authorizerType === "AWS_IAM", "AgentCore Gateway must use IAM authorizer");
assert(ragRuntimeBindings.agentCore.aclPrecheckEnabled === true, "AgentCore runtime must keep ACL precheck enabled");

for (const type of [
  "AWS::Bedrock::KnowledgeBase",
  "AWS::Bedrock::DataSource",
  "AWS::S3Vectors::VectorBucket",
  "AWS::S3Vectors::Index",
  "AWS::BedrockAgentCore::Runtime",
  "AWS::BedrockAgentCore::Gateway",
  "AWS::BedrockAgentCore::GatewayTarget",
  "AWS::IAM::Role"
]) {
  assert(source.includes(`"${type}"`) || ragCatalog.cfnResourceTypes.includes(type), `RAG AWS binding missing resource type ${type}`);
}

for (const token of [
  "S3_VECTORS",
  "S3VectorsConfiguration",
  "FieldMapping",
  "TextField: \"text\"",
  "MetadataField: \"metadata\"",
  "VectorField: \"vector\"",
  "MetadataConfiguration",
  "NonFilterableMetadataKeys",
  "tenant_id,acl_scope_id,document_id,version_id",
  "VectorIngestionConfiguration",
  "CustomTransformationConfiguration",
  "AgentCoreToolsGatewayTarget",
  "OpenApiSchema",
  "TOOLS_API_ENDPOINT",
  "BEDROCK_KNOWLEDGE_BASE_ID",
  "S3_VECTOR_BUCKET_NAME",
  "S3_VECTOR_INDEX_NAME",
  "ACL_PRECHECK_ENABLED",
  "execute-api:Invoke"
]) {
  assert(source.includes(token), `RAG CDK source missing binding token: ${token}`);
}

for (const field of ragRuntimeBindings.s3Vectors.metadataFields) {
  assert(source.includes(field) || field === "source_s3_uri", `S3 Vectors metadata field missing from CDK source: ${field}`);
}

assert(ragRuntimeBindings.agentCore.tools.length === toolContracts.length, "AgentCore tool binding count must match tool contract");
for (const tool of toolContracts) {
  const binding = ragRuntimeBindings.agentCore.tools.find((item) => item.toolName === tool.toolName);
  assert(binding, `AgentCore binding missing tool ${tool.toolName}`);
  assert(binding.path === tool.path, `AgentCore tool path mismatch: ${tool.toolName}`);
  assert(binding.scope === tool.scope, `AgentCore tool scope mismatch: ${tool.toolName}`);
  assert(source.includes(tool.path), `AgentCore OpenAPI target missing tool path ${tool.path}`);
}

const api = createLocalApi();
const csrf = api.request("user-owner", "getMe").body.csrf_token;
const chat = api.request("user-owner", "createChatSession", { csrf_token: csrf, title: "rag aws binding" }).body.chat;
const accepted = api.request("user-owner", "submitQuestion", {
  csrf_token: csrf,
  chat_id: chat.chat_id,
  question: "Saphnexa は何をするシステムか",
  retrieval_policy: { top_k: 10, allowed_acl_scope_ids: ["user:user-owner"] }
});
assert(accepted.status === 202, "RAG binding local question must be accepted");
const toolNames = api.store.state.tool_invocations.map((item) => item.tool_name);
assert(toolNames.indexOf("kb-retrieve") < toolNames.indexOf("acl-check"), "ACL postcheck must run after KB retrieval");
assert(toolNames.includes("evidence-pack"), "RAG binding must package evidence after ACL check");
const aclInvocation = api.store.state.tool_invocations.find((item) => item.tool_name === "acl-check");
assert(aclInvocation.response_summary_json.denied_count >= 1, "ACL postcheck must reject at least one denied candidate in fixture");

for (const forbidden of ["expectedContains", "expectedFiles", "dataset-local-golden", "answerableGoldenCases"]) {
  assert(!fixtureRagSource.includes(forbidden), `fixture RAG implementation must not hard-code benchmark token ${forbidden}`);
}

console.log("RAG AWS binding check passed");
