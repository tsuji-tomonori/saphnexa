import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface SaphnexaConstructProps {
  readonly envName: "dev" | "uat" | "prod";
}

export class SaphnexaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & SaphnexaConstructProps) {
    super(scope, id, props);

    const edge = new EdgeStaticConstruct(this, "EdgeStatic", props);
    const identity = new IdentityConstruct(this, "Identity", props);
    const api = new ApiConstruct(this, "Api", props);
    const realtime = new RealtimeConstruct(this, "Realtime", props);
    const data = new DataConstruct(this, "Data", props);
    const rag = new RagProcessingConstruct(this, "RagProcessing", props);
    const observability = new ObservabilityCicdConstruct(this, "ObservabilityCicd", props);

    output(this, "DistributionDomainName", edge.distributionDomainName);
    output(this, "ApiEndpoint", api.apiEndpoint);
    output(this, "ToolsApiEndpoint", api.toolsApiEndpoint);
    output(this, "UserPoolId", identity.userPoolId);
    output(this, "UserPoolClientId", identity.userPoolClientId);
    output(this, "AppSyncEventApiHttpEndpoint", realtime.httpEndpoint);
    output(this, "AppSyncEventApiRealtimeEndpoint", realtime.realtimeEndpoint);
    output(this, "DsqlEndpoint", data.dsqlEndpoint);
    output(this, "S3VectorBucketName", data.vectorBucketName);
    output(this, "S3VectorIndexName", data.vectorIndexName);
    output(this, "KnowledgeBaseId", rag.knowledgeBaseId);
    output(this, "AgentCoreRuntimeArn", rag.agentCoreRuntimeArn);
    output(this, "DocusaurusLatestUrl", edge.docusaurusLatestUrl);
    output(this, "AllureLatestUrl", edge.allureLatestUrl);
    output(this, "DeployRoleArn", observability.deployRoleArn);
  }
}

export class EdgeStaticConstruct extends Construct {
  readonly distributionDomainName = cdk.Fn.getAtt("CloudFrontDistribution", "DomainName").toString();
  readonly docusaurusLatestUrl: string;
  readonly allureLatestUrl: string;

  constructor(scope: Construct, id: string, props: SaphnexaConstructProps) {
    super(scope, id);
    const adminBucket = cfn(this, "AdminArtifactsBucket", "AWS::S3::Bucket", {
      BucketEncryption: sseKmsEncryption(),
      PublicAccessBlockConfiguration: blockPublicAccess(),
      VersioningConfiguration: { Status: "Enabled" }
    });
    cfn(this, "SpaBucket", "AWS::S3::Bucket", {
      BucketEncryption: sseKmsEncryption(),
      PublicAccessBlockConfiguration: blockPublicAccess()
    });
    cfn(this, "AdminArtifactsBucketPolicy", "AWS::S3::BucketPolicy", {
      Bucket: cdk.Fn.ref(adminBucket.logicalId),
      PolicyDocument: denyPublicBucketPolicy(cdk.Fn.ref(adminBucket.logicalId))
    });
    cfn(this, "SpaOriginAccessControl", "AWS::CloudFront::OriginAccessControl", originAccessControl("spa"));
    cfn(this, "AdminOriginAccessControl", "AWS::CloudFront::OriginAccessControl", originAccessControl("admin-artifacts"));
    cfn(this, "CloudFrontViewerRouter", "AWS::CloudFront::Function", cloudFrontFunction(`${props.envName}-viewer-router`));
    cfn(this, "CloudFrontSignedCookieFunction", "AWS::CloudFront::Function", cloudFrontFunction(`${props.envName}-signed-cookie`));
    cfn(this, "WebAcl", "AWS::WAFv2::WebACL", {
      Scope: "CLOUDFRONT",
      DefaultAction: { Allow: {} },
      VisibilityConfig: visibilityConfig("saphnexa-web-acl")
    });
    cfn(this, "CloudFrontDistribution", "AWS::CloudFront::Distribution", {
      DistributionConfig: {
        Enabled: true,
        DefaultRootObject: "index.html",
        Comment: `saphnexa-${props.envName}`,
        Origins: [],
        DefaultCacheBehavior: { ViewerProtocolPolicy: "redirect-to-https", TargetOriginId: "spa" }
      }
    });
    this.docusaurusLatestUrl = `https://${this.distributionDomainName}/admin/docs/latest/`;
    this.allureLatestUrl = `https://${this.distributionDomainName}/admin/test-reports/allure/latest/`;
  }
}

export class IdentityConstruct extends Construct {
  readonly userPoolId = cdk.Fn.ref("UserPool");
  readonly userPoolClientId = cdk.Fn.ref("UserPoolClient");

  constructor(scope: Construct, id: string, props: SaphnexaConstructProps) {
    super(scope, id);
    cfn(this, "UserPool", "AWS::Cognito::UserPool", {
      UserPoolName: `saphnexa-${props.envName}`,
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: true },
      Schema: [{ Name: "email", Required: true, Mutable: true }]
    });
    cfn(this, "UserPoolClient", "AWS::Cognito::UserPoolClient", {
      UserPoolId: this.userPoolId,
      GenerateSecret: false,
      ExplicitAuthFlows: ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
    });
    cfn(this, "AdminGroup", "AWS::Cognito::UserPoolGroup", { GroupName: "admin", UserPoolId: this.userPoolId });
    cfn(this, "GeneralUserGroup", "AWS::Cognito::UserPoolGroup", { GroupName: "general_user", UserPoolId: this.userPoolId });
    cfn(this, "GitHubOidcProvider", "AWS::IAM::OIDCProvider", {
      Url: "https://token.actions.githubusercontent.com",
      ClientIdList: ["sts.amazonaws.com"]
    });
  }
}

export class ApiConstruct extends Construct {
  readonly apiEndpoint = cdk.Fn.getAtt("HttpApi", "ApiEndpoint").toString();
  readonly toolsApiEndpoint = cdk.Fn.getAtt("ToolsHttpApi", "ApiEndpoint").toString();

  constructor(scope: Construct, id: string) {
    super(scope, id);
    cfn(this, "HttpApi", "AWS::ApiGatewayV2::Api", { Name: "saphnexa-api", ProtocolType: "HTTP" });
    cfn(this, "ToolsHttpApi", "AWS::ApiGatewayV2::Api", { Name: "saphnexa-tools-api", ProtocolType: "HTTP" });
    cfn(this, "HonoApiLambda", "AWS::Lambda::Function", lambdaStub("apps/api"));
    cfn(this, "ToolsApiLambda", "AWS::Lambda::Function", lambdaStub("apps/tools-api"));
    cfn(this, "ApiAccessLogGroup", "AWS::Logs::LogGroup", { RetentionInDays: 90 });
  }
}

export class RealtimeConstruct extends Construct {
  readonly httpEndpoint = cdk.Fn.getAtt("EventApi", "Dns.Http").toString();
  readonly realtimeEndpoint = cdk.Fn.getAtt("EventApi", "Dns.Realtime").toString();

  constructor(scope: Construct, id: string) {
    super(scope, id);
    cfn(this, "EventApi", "AWS::AppSync::Api", {
      Name: "saphnexa-events",
      EventConfig: {
        AuthProviders: [{ AuthType: "AWS_LAMBDA", LambdaAuthorizerConfig: { AuthorizerUri: cdk.Fn.getAtt("SubscribeAuthorizerLambda", "Arn") } }],
        ConnectionAuthModes: [{ AuthType: "AWS_LAMBDA" }],
        DefaultPublishAuthModes: [{ AuthType: "AWS_IAM" }],
        DefaultSubscribeAuthModes: [{ AuthType: "AWS_LAMBDA" }]
      }
    });
    cfn(this, "UserChannelNamespace", "AWS::AppSync::ChannelNamespace", {
      ApiId: cdk.Fn.getAtt("EventApi", "ApiId"),
      Name: "users",
      SubscribeAuthModes: [{ AuthType: "AWS_LAMBDA" }],
      PublishAuthModes: [{ AuthType: "AWS_IAM" }]
    });
    cfn(this, "AdminChannelNamespace", "AWS::AppSync::ChannelNamespace", {
      ApiId: cdk.Fn.getAtt("EventApi", "ApiId"),
      Name: "admin",
      SubscribeAuthModes: [{ AuthType: "AWS_LAMBDA" }],
      PublishAuthModes: [{ AuthType: "AWS_IAM" }]
    });
    cfn(this, "SubscribeAuthorizerLambda", "AWS::Lambda::Function", lambdaStub("apps/workers"));
    cfn(this, "PublishHandlerLambda", "AWS::Lambda::Function", lambdaStub("apps/workers"));
  }
}

export class DataConstruct extends Construct {
  readonly dsqlEndpoint = cdk.Fn.getAtt("DsqlCluster", "Endpoint").toString();
  readonly vectorBucketName = cdk.Fn.ref("S3VectorBucket");
  readonly vectorIndexName = cdk.Fn.ref("S3VectorIndex");

  constructor(scope: Construct, id: string, props: SaphnexaConstructProps) {
    super(scope, id);
    cfn(this, "DataKmsKey", "AWS::KMS::Key", { EnableKeyRotation: true, Description: `saphnexa-${props.envName}-data` });
    cfn(this, "DsqlCluster", "AWS::DSQL::Cluster", {
      DeletionProtectionEnabled: props.envName !== "dev",
      KmsEncryptionKey: cdk.Fn.getAtt("DataKmsKey", "Arn")
    });
    cfn(this, "RawDocumentsBucket", "AWS::S3::Bucket", { BucketEncryption: sseKmsEncryption(), PublicAccessBlockConfiguration: blockPublicAccess() });
    cfn(this, "ParsedDocumentsBucket", "AWS::S3::Bucket", { BucketEncryption: sseKmsEncryption(), PublicAccessBlockConfiguration: blockPublicAccess() });
    cfn(this, "EvaluationArtifactsBucket", "AWS::S3::Bucket", { BucketEncryption: sseKmsEncryption(), PublicAccessBlockConfiguration: blockPublicAccess() });
    cfn(this, "S3VectorBucket", "AWS::S3Vectors::VectorBucket", {
      VectorBucketName: `saphnexa-${props.envName}-vectors`,
      EncryptionConfiguration: { SseType: "aws:kms", KmsKeyArn: cdk.Fn.getAtt("DataKmsKey", "Arn") }
    });
    cfn(this, "S3VectorIndex", "AWS::S3Vectors::Index", {
      VectorBucketName: cdk.Fn.ref("S3VectorBucket"),
      IndexName: `saphnexa-${props.envName}-documents`,
      DataType: "float32",
      Dimension: 1536,
      DistanceMetric: "cosine"
    });
  }
}

export class RagProcessingConstruct extends Construct {
  readonly knowledgeBaseId = cdk.Fn.ref("BedrockKnowledgeBase");
  readonly agentCoreRuntimeArn = cdk.Fn.getAtt("AgentCoreRuntime", "AgentRuntimeArn").toString();

  constructor(scope: Construct, id: string, props: SaphnexaConstructProps) {
    super(scope, id);
    cfn(this, "BedrockKnowledgeBase", "AWS::Bedrock::KnowledgeBase", {
      Name: `Saphnexa${props.envName}KnowledgeBase`,
      RoleArn: cdk.Fn.sub("arn:${AWS::Partition}:iam::${AWS::AccountId}:role/saphnexa-bedrock-kb-role"),
      KnowledgeBaseConfiguration: {
        Type: "VECTOR",
        VectorKnowledgeBaseConfiguration: { EmbeddingModelArn: cdk.Fn.sub("arn:${AWS::Partition}:bedrock:${AWS::Region}::foundation-model/amazon.titan-embed-text-v2:0") }
      },
      StorageConfiguration: { Type: "S3_VECTORS" }
    });
    cfn(this, "BedrockDataSource", "AWS::Bedrock::DataSource", {
      KnowledgeBaseId: this.knowledgeBaseId,
      Name: "saphnexa-documents",
      DataSourceConfiguration: { Type: "S3", S3Configuration: { BucketArn: cdk.Fn.sub("arn:${AWS::Partition}:s3:::saphnexa-${AWS::AccountId}-${AWS::Region}-raw") } }
    });
    cfn(this, "AgentCoreRuntime", "AWS::BedrockAgentCore::Runtime", {
      AgentRuntimeName: `Saphnexa${props.envName}Agent`,
      RoleArn: cdk.Fn.sub("arn:${AWS::Partition}:iam::${AWS::AccountId}:role/saphnexa-agentcore-role"),
      NetworkConfiguration: { NetworkMode: "PUBLIC" },
      AgentRuntimeArtifact: { ContainerConfiguration: { ContainerUri: "replace-with-ecr-image-uri" } },
      ProtocolConfiguration: "HTTP"
    });
    cfn(this, "AgentCoreGateway", "AWS::BedrockAgentCore::Gateway", {
      Name: `saphnexa-${props.envName}-tools`,
      RoleArn: cdk.Fn.sub("arn:${AWS::Partition}:iam::${AWS::AccountId}:role/saphnexa-agentcore-gateway-role"),
      ProtocolType: "MCP"
    });
    for (const name of ["IngestionQueue", "EvaluationQueue"]) cfn(this, name, "AWS::SQS::Queue", { VisibilityTimeout: 300, RedrivePolicy: { maxReceiveCount: 3 } });
    for (const name of ["IngestionDlq", "EvaluationDlq"]) cfn(this, name, "AWS::SQS::Queue", { MessageRetentionPeriod: 1209600 });
    cfn(this, "IngestionWorkerLambda", "AWS::Lambda::Function", lambdaStub("apps/workers"));
    cfn(this, "EvaluationWorkerLambda", "AWS::Lambda::Function", lambdaStub("apps/workers"));
  }
}

export class ObservabilityCicdConstruct extends Construct {
  readonly deployRoleArn = cdk.Fn.getAtt("DeployRole", "Arn").toString();

  constructor(scope: Construct, id: string) {
    super(scope, id);
    cfn(this, "DeployRole", "AWS::IAM::Role", { AssumeRolePolicyDocument: { Version: "2012-10-17", Statement: [] } });
    cfn(this, "EventBus", "AWS::Events::EventBus", { Name: "saphnexa-events" });
    for (const name of ["Api5xxAlarm", "DlqAlarm", "RagFailureAlarm", "IngestionFailureAlarm", "EvaluationFailureAlarm"]) {
      cfn(this, name, "AWS::CloudWatch::Alarm", {
        EvaluationPeriods: 1,
        ComparisonOperator: "GreaterThanThreshold",
        Threshold: 0,
        MetricName: name,
        Namespace: "Saphnexa"
      });
    }
  }
}

function cfn(scope: Construct, id: string, type: string, properties: Record<string, unknown>) {
  return new cdk.CfnResource(scope, id, { type, properties });
}

function output(scope: Construct, id: string, value: string) {
  new cdk.CfnOutput(scope, id, { value });
}

function lambdaStub(packagePath: string) {
  return {
    Runtime: "nodejs22.x",
    Handler: "index.handler",
    Role: cdk.Fn.sub("arn:${AWS::Partition}:iam::${AWS::AccountId}:role/saphnexa-lambda-role"),
    Code: { S3Bucket: "replace-with-deployment-artifacts-bucket", S3Key: `${packagePath}/bundle.zip` }
  };
}

function sseKmsEncryption() {
  return { ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: "aws:kms" } }] };
}

function blockPublicAccess() {
  return { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true };
}

function denyPublicBucketPolicy(bucketName: string) {
  return {
    Version: "2012-10-17",
    Statement: [{ Effect: "Deny", Principal: "*", Action: "s3:*", Resource: [`arn:aws:s3:::${bucketName}`, `arn:aws:s3:::${bucketName}/*`], Condition: { Bool: { "aws:SecureTransport": false } } }]
  };
}

function originAccessControl(name: string) {
  return { OriginAccessControlConfig: { Name: `saphnexa-${name}`, OriginAccessControlOriginType: "s3", SigningBehavior: "always", SigningProtocol: "sigv4" } };
}

function cloudFrontFunction(name: string) {
  return { Name: `saphnexa-${name}`, AutoPublish: true, FunctionCode: "function handler(event) { return event.request; }", FunctionConfig: { Runtime: "cloudfront-js-2.0", Comment: name } };
}

function visibilityConfig(name: string) {
  return { CloudWatchMetricsEnabled: true, MetricName: name, SampledRequestsEnabled: true };
}
