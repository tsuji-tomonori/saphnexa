export const cdkConstructResourceSpecs = [
  constructSpec("EdgeStaticConstruct", [
    resource("CloudFrontDistribution", "AWS::CloudFront::Distribution"),
    resource("SpaBucket", "AWS::S3::Bucket"),
    resource("AdminArtifactsBucket", "AWS::S3::Bucket"),
    resource("AdminArtifactsBucketPolicy", "AWS::S3::BucketPolicy"),
    resource("CloudFrontViewerRouter", "AWS::CloudFront::Function"),
    resource("CloudFrontSignedCookieFunction", "AWS::CloudFront::Function"),
    resource("SpaOriginAccessControl", "AWS::CloudFront::OriginAccessControl"),
    resource("AdminOriginAccessControl", "AWS::CloudFront::OriginAccessControl"),
    resource("WebAcl", "AWS::WAFv2::WebACL")
  ], [
    "DistributionDomainName",
    "AdminArtifactsBucketArn",
    "SignedCookieKeyGroupId",
    "DocusaurusLatestUrl",
    "AllureLatestUrl"
  ]),
  constructSpec("IdentityConstruct", [
    resource("UserPool", "AWS::Cognito::UserPool"),
    resource("UserPoolClient", "AWS::Cognito::UserPoolClient"),
    resource("AdminGroup", "AWS::Cognito::UserPoolGroup"),
    resource("GeneralUserGroup", "AWS::Cognito::UserPoolGroup"),
    resource("GitHubOidcProvider", "AWS::IAM::OIDCProvider")
  ], ["UserPoolId", "UserPoolClientId", "CognitoIssuer", "AdminGroupName"]),
  constructSpec("ApiConstruct", [
    resource("HttpApi", "AWS::ApiGatewayV2::Api"),
    resource("ToolsHttpApi", "AWS::ApiGatewayV2::Api"),
    resource("HonoApiLambda", "AWS::Lambda::Function"),
    resource("ToolsApiLambda", "AWS::Lambda::Function"),
    resource("ApiAccessLogGroup", "AWS::Logs::LogGroup")
  ], ["ApiEndpoint", "ToolsApiEndpoint", "ApiLambdaArn", "ToolsLambdaArn"]),
  constructSpec("RealtimeConstruct", [
    resource("EventApi", "AWS::AppSync::Api"),
    resource("UserChannelNamespace", "AWS::AppSync::ChannelNamespace"),
    resource("AdminChannelNamespace", "AWS::AppSync::ChannelNamespace"),
    resource("SubscribeAuthorizerLambda", "AWS::Lambda::Function"),
    resource("PublishHandlerLambda", "AWS::Lambda::Function")
  ], ["AppSyncEventApiHttpEndpoint", "AppSyncEventApiRealtimeEndpoint", "RealtimeNamespaceNames"]),
  constructSpec("DataConstruct", [
    resource("DsqlCluster", "AWS::DSQL::Cluster"),
    resource("RawDocumentsBucket", "AWS::S3::Bucket"),
    resource("ParsedDocumentsBucket", "AWS::S3::Bucket"),
    resource("EvaluationArtifactsBucket", "AWS::S3::Bucket"),
    resource("S3VectorBucket", "AWS::S3Vectors::VectorBucket"),
    resource("S3VectorIndex", "AWS::S3Vectors::Index"),
    resource("DataKmsKey", "AWS::KMS::Key")
  ], ["DsqlEndpoint", "DsqlClusterArn", "RawDocumentsBucketName", "S3VectorBucketName", "S3VectorIndexName", "DataKmsKeyArn"]),
  constructSpec("RagProcessingConstruct", [
    resource("BedrockKnowledgeBase", "AWS::Bedrock::KnowledgeBase"),
    resource("BedrockDataSource", "AWS::Bedrock::DataSource"),
    resource("AgentCoreRuntime", "AWS::BedrockAgentCore::Runtime"),
    resource("AgentCoreGateway", "AWS::BedrockAgentCore::Gateway"),
    resource("IngestionQueue", "AWS::SQS::Queue"),
    resource("IngestionDlq", "AWS::SQS::Queue"),
    resource("EvaluationQueue", "AWS::SQS::Queue"),
    resource("EvaluationDlq", "AWS::SQS::Queue"),
    resource("IngestionWorkerLambda", "AWS::Lambda::Function"),
    resource("EvaluationWorkerLambda", "AWS::Lambda::Function")
  ], ["KnowledgeBaseId", "KnowledgeBaseArn", "AgentCoreRuntimeArn", "AgentCoreGatewayId", "IngestionQueueUrl", "EvaluationQueueUrl"]),
  constructSpec("ObservabilityCicdConstruct", [
    resource("DeployRole", "AWS::IAM::Role"),
    resource("EventBus", "AWS::Events::EventBus"),
    resource("Api5xxAlarm", "AWS::CloudWatch::Alarm"),
    resource("DlqAlarm", "AWS::CloudWatch::Alarm"),
    resource("RagFailureAlarm", "AWS::CloudWatch::Alarm"),
    resource("IngestionFailureAlarm", "AWS::CloudWatch::Alarm"),
    resource("EvaluationFailureAlarm", "AWS::CloudWatch::Alarm")
  ], ["DeployRoleArn", "EventBusArn", "AlarmNames"])
];

export const cdkRequiredResourceTypes = [...new Set(cdkConstructResourceSpecs.flatMap((spec) => spec.resources.map((item) => item.type)))].sort();

export function specByConstructName(name) {
  return cdkConstructResourceSpecs.find((spec) => spec.name === name);
}

function constructSpec(name, resources, outputs) {
  return { name, resources, outputs };
}

function resource(logicalId, type) {
  return { logicalId, type };
}
