import {
  assert,
  assertNoPlaceholder,
  parseArgs,
  printHelp,
  requiredEnv,
  requiredHttpsUrl,
  requireEnvironment,
  writeCapture
} from "./aws-dev-uat-capture-helper-lib.js";

const required = [
  "SAPHNEXA_RAG_GOLDEN_DATASET",
  "SAPHNEXA_RAG_EVALUATION_JOB_ID",
  "SAPHNEXA_RAG_BEDROCK_EVALUATION_JOB_ARN",
  "SAPHNEXA_RAG_RECALL_AT_10",
  "SAPHNEXA_RAG_CITATION_PRECISION",
  "SAPHNEXA_RAG_GROUNDEDNESS",
  "SAPHNEXA_RAG_REFUSAL_ACCURACY",
  "SAPHNEXA_RAG_UNSUPPORTED_CLAIM_RATE",
  "SAPHNEXA_RAG_REPORT_URL"
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp({ script: "capture-aws-dev-uat-rag-quality-result.js", env: required });
  process.exit(0);
}

const context = requireEnvironment(args);
const env = requiredEnv(required);
const recallAt10 = requiredRatio(env.SAPHNEXA_RAG_RECALL_AT_10, "SAPHNEXA_RAG_RECALL_AT_10");
const citationPrecision = requiredRatio(env.SAPHNEXA_RAG_CITATION_PRECISION, "SAPHNEXA_RAG_CITATION_PRECISION");
const groundedness = requiredRatio(env.SAPHNEXA_RAG_GROUNDEDNESS, "SAPHNEXA_RAG_GROUNDEDNESS");
const refusalAccuracy = requiredRatio(env.SAPHNEXA_RAG_REFUSAL_ACCURACY, "SAPHNEXA_RAG_REFUSAL_ACCURACY");
const unsupportedClaimRate = requiredRatio(env.SAPHNEXA_RAG_UNSUPPORTED_CLAIM_RATE, "SAPHNEXA_RAG_UNSUPPORTED_CLAIM_RATE");
const reportUrl = requiredHttpsUrl(env.SAPHNEXA_RAG_REPORT_URL, "SAPHNEXA_RAG_REPORT_URL");

assertNoPlaceholder(env.SAPHNEXA_RAG_GOLDEN_DATASET, "SAPHNEXA_RAG_GOLDEN_DATASET");
assertNoPlaceholder(env.SAPHNEXA_RAG_EVALUATION_JOB_ID, "SAPHNEXA_RAG_EVALUATION_JOB_ID");
assertNoPlaceholder(env.SAPHNEXA_RAG_BEDROCK_EVALUATION_JOB_ARN, "SAPHNEXA_RAG_BEDROCK_EVALUATION_JOB_ARN");
assert(env.SAPHNEXA_RAG_BEDROCK_EVALUATION_JOB_ARN.startsWith("arn:aws:bedrock:"), "SAPHNEXA_RAG_BEDROCK_EVALUATION_JOB_ARN must be a Bedrock ARN");
assert(recallAt10 >= 0.8, "recall@10 must be >= 0.80");
assert(citationPrecision >= 0.9, "citation precision must be >= 0.90");
assert(groundedness >= 0.9, "groundedness must be >= 0.90");
assert(refusalAccuracy >= 0.9, "refusal accuracy must be >= 0.90");
assert(unsupportedClaimRate <= 0.05, "unsupported claim rate must be <= 0.05");

writeCapture({
  schema_version: "saphnexa-aws-dev-uat-rag-quality-result.raw.v1",
  ...context,
  status: "captured",
  golden_dataset: env.SAPHNEXA_RAG_GOLDEN_DATASET,
  evaluation_job_id: env.SAPHNEXA_RAG_EVALUATION_JOB_ID,
  bedrock_evaluation_job_arn: env.SAPHNEXA_RAG_BEDROCK_EVALUATION_JOB_ARN,
  recall_at_10: recallAt10,
  citation_precision: citationPrecision,
  groundedness,
  refusal_accuracy: refusalAccuracy,
  unsupported_claim_rate: unsupportedClaimRate,
  report_url: reportUrl
});

function requiredRatio(value, label) {
  assert(/^(0(\.\d+)?|1(\.0+)?)$/.test(value), `${label} must be a ratio between 0 and 1`);
  return Number(value);
}
