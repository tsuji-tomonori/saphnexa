import {
  parseArgs,
  printHelp,
  probeUrl,
  requiredEnv,
  requiredHttpsUrl,
  requiredWssUrl,
  requireEnvironment,
  writeCapture
} from "./aws-dev-uat-capture-helper-lib.js";

const required = [
  "SAPHNEXA_CLOUDFRONT_URL",
  "SAPHNEXA_COGNITO_USER_POOL_ID",
  "SAPHNEXA_COGNITO_USER_POOL_CLIENT_ID",
  "SAPHNEXA_APPSYNC_EVENT_API_HTTP_ENDPOINT",
  "SAPHNEXA_APPSYNC_EVENT_API_REALTIME_ENDPOINT"
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp({ script: "capture-edge-realtime-smoke.js", env: required });
  process.exit(0);
}

const context = requireEnvironment(args);
const env = requiredEnv(required);
const cloudFrontUrl = requiredHttpsUrl(env.SAPHNEXA_CLOUDFRONT_URL, "SAPHNEXA_CLOUDFRONT_URL");
const appSyncHttpEndpoint = requiredHttpsUrl(env.SAPHNEXA_APPSYNC_EVENT_API_HTTP_ENDPOINT, "SAPHNEXA_APPSYNC_EVENT_API_HTTP_ENDPOINT");
const appSyncRealtimeEndpoint = requiredWssUrl(env.SAPHNEXA_APPSYNC_EVENT_API_REALTIME_ENDPOINT, "SAPHNEXA_APPSYNC_EVENT_API_REALTIME_ENDPOINT");

const cloudFront = await probeUrl(cloudFrontUrl, { method: "GET" });
const appSyncHttp = await probeUrl(appSyncHttpEndpoint, { method: "GET" });

writeCapture({
  schema_version: "saphnexa-edge-realtime-smoke.raw.v1",
  ...context,
  status: cloudFront.ok && appSyncHttp.ok ? "captured" : "failed",
  cloudfront_url: cloudFrontUrl,
  cloudfront_probe: cloudFront,
  cognito_user_pool_id: env.SAPHNEXA_COGNITO_USER_POOL_ID,
  cognito_user_pool_client_id: env.SAPHNEXA_COGNITO_USER_POOL_CLIENT_ID,
  appsync_event_api_http_endpoint: appSyncHttpEndpoint,
  appsync_event_api_http_probe: appSyncHttp,
  appsync_event_api_realtime_endpoint: appSyncRealtimeEndpoint,
  ws_ticket_authorizer_expected: true
});
