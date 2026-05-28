import { readText, assert } from "./lib.js";
import { synthLocalInventory } from "../infra/bin/app.js";
import { edgeIdentityRealtimeBindings } from "../infra/cdk/edge-identity-realtime-bindings.js";

const source = readText("infra/cdk/saphnexa-stack.ts");
const routesSource = readText("apps/web/src/routes.ts");
const inventory = synthLocalInventory("uat");
const edge = inventory.intent_catalog.EdgeStaticConstruct;
const identity = inventory.intent_catalog.IdentityConstruct;
const realtime = inventory.intent_catalog.RealtimeConstruct;

assert(edge.edgeRoutingIntent.bindingSource === edgeIdentityRealtimeBindings, "edge intent must expose binding source");
assert(identity.cognitoBindingIntent === edgeIdentityRealtimeBindings.cognito, "identity intent must expose Cognito binding source");
assert(realtime.channelPolicyIntent.bindingSource === edgeIdentityRealtimeBindings.appSyncEvents, "realtime intent must expose AppSync Events binding source");

for (const originId of ["spa-origin", "api-origin", "appsync-events-origin", "admin-artifacts-origin"]) {
  assert(edgeIdentityRealtimeBindings.origins.some((item) => item.id === originId), `binding origin missing: ${originId}`);
  assert(source.includes(`"${originId}"`), `CDK source missing CloudFront origin ${originId}`);
}

for (const pattern of ["/api/*", "/auth/*", "/event/realtime*", "/admin/docs/*", "/admin/test-reports/*", "/admin/evaluation-reports/*", "/chat/*", "/admin/*"]) {
  assert(source.includes(`"${pattern}"`), `CDK source missing cache behavior ${pattern}`);
}

for (const rewrite of [
  ["/", "/chat/index.html"],
  ["/api/", "/v1/"],
  ["/auth/", "/v1/auth/"],
  ["/admin/docs/latest/", "/docs-site/latest/"],
  ["/admin/docs/versions/", "/docs-site/releases/"],
  ["/admin/test-reports/allure/", "/test-reports/allure/"],
  ["/admin/evaluation-reports/", "/reports/evaluations/"]
]) {
  const [from, to] = rewrite;
  assert(source.includes(from), `CloudFront Function source missing rewrite source ${from}`);
  assert(source.includes(to), `CloudFront Function source missing rewrite target ${to}`);
}

assert(source.includes("AdminArtifactsPublicKeyPem"), "CDK stack must require admin artifacts public key parameter");
assert(source.includes("\"AWS::CloudFront::PublicKey\""), "CDK stack must create CloudFront public key");
assert(source.includes("\"AWS::CloudFront::KeyGroup\""), "CDK stack must create CloudFront key group");
assert(source.includes("TrustedKeyGroups"), "admin artifact behavior must trust the signed cookie key group");

assert(source.includes("AllowedOAuthFlowsUserPoolClient: true"), "Cognito client must enable OAuth features");
assert(source.includes("AllowedOAuthFlows: [\"code\"]"), "Cognito client must use authorization code flow");
for (const scope of edgeIdentityRealtimeBindings.cognito.scopes) {
  assert(source.includes(`"${scope}"`), `Cognito OAuth scope missing: ${scope}`);
}
for (const callback of [edgeIdentityRealtimeBindings.cognito.callbackPath, edgeIdentityRealtimeBindings.cognito.logoutPath]) {
  assert(source.includes(callback), `Cognito callback/logout path missing: ${callback}`);
  assert(routesSource.includes(callback), `web route metadata missing auth path: ${callback}`);
}

assert(source.includes("\"AWS::AppSync::Api\""), "AppSync Events API resource missing");
assert(source.includes("\"AWS::AppSync::ChannelNamespace\""), "AppSync Events channel namespace resource missing");
for (const namespace of edgeIdentityRealtimeBindings.appSyncEvents.namespaces) {
  assert(source.includes(`Name: "${namespace.name}"`), `AppSync Events namespace missing: ${namespace.name}`);
  assert(namespace.subscribeAuthorizer === "ws-ticket", `namespace ${namespace.name} must use ws-ticket subscribe authorizer`);
  assert(namespace.publishAuthMode === "AWS_IAM", `namespace ${namespace.name} must use IAM publish`);
}
assert(!source.includes("AWS::AppSync::GraphQLApi"), "AppSync Events binding must not use GraphQL API");

for (const route of ["/", "/chat", "/admin", "/admin/docs/latest/", "/admin/test-reports/allure/latest/", "/event/realtime"]) {
  assert(routesSource.includes(`path: "${route}"`), `single-entry route metadata missing: ${route}`);
}
for (const forbidden of ["execute-api", "appsync-api", "appsync-realtime-api"]) {
  assert(!routesSource.includes(forbidden), `web route metadata must not embed service domain: ${forbidden}`);
}

console.log("edge identity realtime binding check passed");
