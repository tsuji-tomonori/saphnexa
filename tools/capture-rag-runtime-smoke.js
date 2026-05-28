import {
  parseArgs,
  printHelp,
  probeUrl,
  requiredEnv,
  requiredHttpsUrl,
  requireEnvironment,
  writeCapture
} from "./aws-dev-uat-capture-helper-lib.js";

const required = [
  "SAPHNEXA_BEDROCK_KNOWLEDGE_BASE_ID",
  "SAPHNEXA_S3_VECTOR_BUCKET_NAME",
  "SAPHNEXA_S3_VECTOR_INDEX_NAME",
  "SAPHNEXA_AGENTCORE_RUNTIME_ARN",
  "SAPHNEXA_TOOLS_API_URL"
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp({ script: "capture-rag-runtime-smoke.js", env: required });
  process.exit(0);
}

const context = requireEnvironment(args);
const env = requiredEnv(required);
const toolsApiUrl = requiredHttpsUrl(env.SAPHNEXA_TOOLS_API_URL, "SAPHNEXA_TOOLS_API_URL");

const toolsApiProbe = await probeUrl(toolsApiUrl, { method: "GET" });

writeCapture({
  schema_version: "saphnexa-rag-runtime-smoke.raw.v1",
  ...context,
  status: toolsApiProbe.ok ? "captured" : "failed",
  bedrock_knowledge_base_id: env.SAPHNEXA_BEDROCK_KNOWLEDGE_BASE_ID,
  s3_vector_bucket_name: env.SAPHNEXA_S3_VECTOR_BUCKET_NAME,
  s3_vector_index_name: env.SAPHNEXA_S3_VECTOR_INDEX_NAME,
  agentcore_runtime_arn: env.SAPHNEXA_AGENTCORE_RUNTIME_ARN,
  tools_api_url: toolsApiUrl,
  tools_api_probe: toolsApiProbe,
  tools_gateway_authorized_expected: true,
  acl_precheck_expected: true
});
