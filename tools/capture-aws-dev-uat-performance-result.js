import {
  assert,
  parseArgs,
  printHelp,
  requiredEnv,
  requiredHttpsUrl,
  requireEnvironment,
  writeCapture
} from "./aws-dev-uat-capture-helper-lib.js";

const required = [
  "SAPHNEXA_PERF_LOAD_PROFILE",
  "SAPHNEXA_PERF_NON_AI_API_P95_MS",
  "SAPHNEXA_PERF_ERROR_RATE",
  "SAPHNEXA_PERF_QUESTION_START_P95_MS",
  "SAPHNEXA_PERF_RAG_FIRST_NOTICE_P95_MS",
  "SAPHNEXA_PERF_FINAL_ANSWER_P95_MS",
  "SAPHNEXA_PERF_TIMEOUT_RATE",
  "SAPHNEXA_PERF_REPORT_URL",
  "SAPHNEXA_CLOUDWATCH_DASHBOARD_URL"
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp({ script: "capture-aws-dev-uat-performance-result.js", env: required });
  process.exit(0);
}

const context = requireEnvironment(args);
const env = requiredEnv(required);
const nonAiApiP95Ms = requiredNumber(env.SAPHNEXA_PERF_NON_AI_API_P95_MS, "SAPHNEXA_PERF_NON_AI_API_P95_MS");
const errorRate = requiredNumber(env.SAPHNEXA_PERF_ERROR_RATE, "SAPHNEXA_PERF_ERROR_RATE");
const questionStartP95Ms = requiredNumber(env.SAPHNEXA_PERF_QUESTION_START_P95_MS, "SAPHNEXA_PERF_QUESTION_START_P95_MS");
const ragFirstNoticeP95Ms = requiredNumber(env.SAPHNEXA_PERF_RAG_FIRST_NOTICE_P95_MS, "SAPHNEXA_PERF_RAG_FIRST_NOTICE_P95_MS");
const finalAnswerP95Ms = requiredNumber(env.SAPHNEXA_PERF_FINAL_ANSWER_P95_MS, "SAPHNEXA_PERF_FINAL_ANSWER_P95_MS");
const timeoutRate = requiredNumber(env.SAPHNEXA_PERF_TIMEOUT_RATE, "SAPHNEXA_PERF_TIMEOUT_RATE");
const reportUrl = requiredHttpsUrl(env.SAPHNEXA_PERF_REPORT_URL, "SAPHNEXA_PERF_REPORT_URL");
const cloudwatchDashboardUrl = requiredHttpsUrl(env.SAPHNEXA_CLOUDWATCH_DASHBOARD_URL, "SAPHNEXA_CLOUDWATCH_DASHBOARD_URL");

assert(nonAiApiP95Ms <= 800, "non-AI API p95 must be <= 800ms");
assert(errorRate < 0.01, "error rate must be < 0.01");
assert(questionStartP95Ms <= 2000, "question start p95 must be <= 2000ms");
assert(ragFirstNoticeP95Ms <= 5000, "RAG first notice p95 must be <= 5000ms");
assert(finalAnswerP95Ms <= 60000, "final answer p95 must be <= 60000ms");
assert(timeoutRate < 0.02, "timeout rate must be < 0.02");

writeCapture({
  schema_version: "saphnexa-aws-dev-uat-performance-result.raw.v1",
  ...context,
  status: "captured",
  load_profile: env.SAPHNEXA_PERF_LOAD_PROFILE,
  non_ai_api_p95_ms: nonAiApiP95Ms,
  error_rate: errorRate,
  question_start_p95_ms: questionStartP95Ms,
  rag_first_notice_p95_ms: ragFirstNoticeP95Ms,
  final_answer_p95_ms: finalAnswerP95Ms,
  timeout_rate: timeoutRate,
  report_url: reportUrl,
  cloudwatch_dashboard_url: cloudwatchDashboardUrl
});

function requiredNumber(value, label) {
  assert(/^\d+(\.\d+)?$/.test(value), `${label} must be a number`);
  return Number(value);
}
