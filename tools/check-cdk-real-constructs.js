import { readJson, readText, assert } from "./lib.js";
import { cdkConstructResourceSpecs, cdkRequiredResourceTypes } from "../infra/cdk/resource-specs.js";
import { synthLocalInventory } from "../infra/bin/app.js";

const source = readText("infra/cdk/saphnexa-stack.ts");
const infraPackage = readJson("infra/package.json");
const inventory = synthLocalInventory("uat");

assert(infraPackage.dependencies?.["aws-cdk-lib"], "infra package must declare aws-cdk-lib");
assert(infraPackage.dependencies?.constructs, "infra package must declare constructs");
assert(source.includes("import * as cdk from \"aws-cdk-lib\""), "CDK stack source must import aws-cdk-lib");
assert(source.includes("import { Construct } from \"constructs\""), "CDK stack source must import Construct");
assert(source.includes("export class SaphnexaStack extends cdk.Stack"), "CDK stack source must define SaphnexaStack");

for (const spec of cdkConstructResourceSpecs) {
  assert(source.includes(`export class ${spec.name} extends Construct`), `${spec.name} must be a real Construct class`);
  const catalog = inventory.intent_catalog[spec.name];
  assert(catalog, `local inventory missing ${spec.name}`);
  assert(JSON.stringify(catalog.cfnResources) === JSON.stringify(spec.resources), `${spec.name} cfn resources must match spec`);
  assert(JSON.stringify(catalog.cfnOutputs) === JSON.stringify(spec.outputs), `${spec.name} cfn outputs must match spec`);
  for (const item of spec.resources) {
    assert(source.includes(`"${item.logicalId}"`), `${spec.name} source missing logical id ${item.logicalId}`);
    assert(source.includes(`"${item.type}"`), `${spec.name} source missing resource type ${item.type}`);
  }
}

for (const type of [
  "AWS::DSQL::Cluster",
  "AWS::CloudFront::Distribution",
  "AWS::CloudFront::PublicKey",
  "AWS::CloudFront::KeyGroup",
  "AWS::Cognito::UserPool",
  "AWS::Cognito::UserPoolDomain",
  "AWS::AppSync::Api",
  "AWS::AppSync::ChannelNamespace",
  "AWS::S3Vectors::VectorBucket",
  "AWS::S3Vectors::Index",
  "AWS::Bedrock::KnowledgeBase",
  "AWS::Bedrock::DataSource",
  "AWS::BedrockAgentCore::Runtime",
  "AWS::BedrockAgentCore::Gateway"
]) {
  assert(cdkRequiredResourceTypes.includes(type), `required CDK resource type missing from spec: ${type}`);
}

assert(source.includes("DocusaurusLatestUrl"), "CDK stack must output DocusaurusLatestUrl");
assert(source.includes("AllureLatestUrl"), "CDK stack must output AllureLatestUrl");
assert(source.includes("AppSyncEventApiHttpEndpoint"), "CDK stack must output AppSync Events HTTP endpoint");
assert(source.includes("AppSyncEventApiRealtimeEndpoint"), "CDK stack must output AppSync Events realtime endpoint");
assert(source.includes("AgentCoreRuntimeArn"), "CDK stack must output AgentCore runtime ARN");
assert(source.includes("S3VectorIndexName"), "CDK stack must output S3 vector index name");
assert(!source.includes("AWS::AppSync::GraphQLApi"), "AppSync Events must not regress to GraphQL API resource");

console.log("CDK real construct source check passed");
