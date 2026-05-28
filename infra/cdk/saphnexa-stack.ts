import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface SaphnexaConstructProps {
  readonly envName: "dev" | "uat" | "prod";
}

interface EdgeStaticConstructProps extends SaphnexaConstructProps {
  readonly apiEndpoint: string;
  readonly appSyncEventRealtimeEndpoint: string;
  readonly adminArtifactsPublicKeyPem: string;
}

interface IdentityConstructProps extends SaphnexaConstructProps {
  readonly viewerBaseUrl: string;
}

export class SaphnexaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & SaphnexaConstructProps) {
    super(scope, id, props);

    const adminArtifactsPublicKeyPem = new cdk.CfnParameter(this, "AdminArtifactsPublicKeyPem", {
      Type: "String",
      NoEcho: true,
      Description: "CloudFront signed cookie public key PEM for admin artifacts."
    });
    const api = new ApiConstruct(this, "Api", props);
    const realtime = new RealtimeConstruct(this, "Realtime", props);
    const data = new DataConstruct(this, "Data", props);
    const rag = new RagProcessingConstruct(this, "RagProcessing", props);
    const observability = new ObservabilityCicdConstruct(this, "ObservabilityCicd", props);
    const edge = new EdgeStaticConstruct(this, "EdgeStatic", {
      ...props,
      apiEndpoint: api.apiEndpoint,
      appSyncEventRealtimeEndpoint: realtime.realtimeEndpoint,
      adminArtifactsPublicKeyPem: adminArtifactsPublicKeyPem.valueAsString
    });
    const identity = new IdentityConstruct(this, "Identity", {
      ...props,
      viewerBaseUrl: cdk.Fn.join("", ["https://", edge.distributionDomainName])
    });

    output(this, "DistributionDomainName", edge.distributionDomainName);
    output(this, "CloudFrontDistributionDomain", edge.distributionDomainName);
    output(this, "AdminArtifactsBucketArn", edge.adminArtifactsBucketArn);
    output(this, "SignedCookieKeyGroupId", edge.signedCookieKeyGroupId);
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
  readonly adminArtifactsBucketArn = cdk.Fn.getAtt("AdminArtifactsBucket", "Arn").toString();
  readonly signedCookieKeyGroupId = cdk.Fn.ref("AdminArtifactsKeyGroup");
  readonly docusaurusLatestUrl: string;
  readonly allureLatestUrl: string;

  constructor(scope: Construct, id: string, props: EdgeStaticConstructProps) {
    super(scope, id);
    const adminBucket = cfn(this, "AdminArtifactsBucket", "AWS::S3::Bucket", {
      BucketEncryption: sseKmsEncryption(),
      PublicAccessBlockConfiguration: blockPublicAccess(),
      VersioningConfiguration: { Status: "Enabled" }
    });
    const spaBucket = cfn(this, "SpaBucket", "AWS::S3::Bucket", {
      BucketEncryption: sseKmsEncryption(),
      PublicAccessBlockConfiguration: blockPublicAccess(),
      VersioningConfiguration: { Status: "Enabled" }
    });
    cfn(this, "SpaBucketPolicy", "AWS::S3::BucketPolicy", {
      Bucket: cdk.Fn.ref(spaBucket.logicalId),
      PolicyDocument: cloudFrontOnlyBucketPolicy(cdk.Fn.ref(spaBucket.logicalId), cdk.Fn.sub("arn:${AWS::Partition}:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"))
    });
    cfn(this, "AdminArtifactsBucketPolicy", "AWS::S3::BucketPolicy", {
      Bucket: cdk.Fn.ref(adminBucket.logicalId),
      PolicyDocument: cloudFrontOnlyBucketPolicy(cdk.Fn.ref(adminBucket.logicalId), cdk.Fn.sub("arn:${AWS::Partition}:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"))
    });
    cfn(this, "SpaOriginAccessControl", "AWS::CloudFront::OriginAccessControl", originAccessControl("spa"));
    cfn(this, "AdminOriginAccessControl", "AWS::CloudFront::OriginAccessControl", originAccessControl("admin-artifacts"));
    cfn(this, "CloudFrontViewerRouter", "AWS::CloudFront::Function", cloudFrontFunction(`${props.envName}-viewer-router`, viewerRouterFunctionCode()));
    cfn(this, "CloudFrontApiVersionRewriteFunction", "AWS::CloudFront::Function", cloudFrontFunction(`${props.envName}-api-version-rewrite`, apiVersionRewriteFunctionCode()));
    cfn(this, "CloudFrontAdminArtifactRewriteFunction", "AWS::CloudFront::Function", cloudFrontFunction(`${props.envName}-admin-artifact-rewrite`, adminArtifactRewriteFunctionCode()));
    cfn(this, "AdminArtifactsPublicKey", "AWS::CloudFront::PublicKey", {
      PublicKeyConfig: {
        CallerReference: cdk.Fn.sub("${AWS::StackName}-admin-artifacts-public-key"),
        Name: `saphnexa-${props.envName}-admin-artifacts`,
        EncodedKey: props.adminArtifactsPublicKeyPem,
        Comment: "Signed cookie public key for admin-only Docusaurus and Allure artifacts."
      }
    });
    cfn(this, "AdminArtifactsKeyGroup", "AWS::CloudFront::KeyGroup", {
      KeyGroupConfig: {
        Name: `saphnexa-${props.envName}-admin-artifacts`,
        Items: [cdk.Fn.ref("AdminArtifactsPublicKey")],
        Comment: "Trusted key group for admin-only Docusaurus and Allure artifacts."
      }
    });
    cfn(this, "WebAcl", "AWS::WAFv2::WebACL", {
      Scope: "CLOUDFRONT",
      DefaultAction: { Allow: {} },
      Rules: [
        managedRule("AWSManagedRulesCommonRuleSet", 10),
        managedRule("AWSManagedRulesKnownBadInputsRuleSet", 20),
        rateLimitRule("EdgeRateLimit", 30, 2000)
      ],
      VisibilityConfig: visibilityConfig("saphnexa-web-acl")
    });
    cfn(this, "CloudFrontDistribution", "AWS::CloudFront::Distribution", {
      DistributionConfig: {
        Enabled: true,
        DefaultRootObject: "index.html",
        Comment: `saphnexa-${props.envName}`,
        HttpVersion: "http2and3",
        Origins: [
          s3Origin("spa-origin", cdk.Fn.getAtt("SpaBucket", "RegionalDomainName").toString(), cdk.Fn.getAtt("SpaOriginAccessControl", "Id").toString()),
          s3Origin("admin-artifacts-origin", cdk.Fn.getAtt("AdminArtifactsBucket", "RegionalDomainName").toString(), cdk.Fn.getAtt("AdminOriginAccessControl", "Id").toString()),
          httpOrigin("api-origin", domainNameFromUrl(props.apiEndpoint)),
          httpOrigin("appsync-events-origin", props.appSyncEventRealtimeEndpoint)
        ],
        DefaultCacheBehavior: spaBehavior("spa-origin", "CloudFrontViewerRouter"),
        CacheBehaviors: [
          apiBehavior("/api/*", "api-origin", "CloudFrontApiVersionRewriteFunction"),
          apiBehavior("/auth/*", "api-origin", "CloudFrontApiVersionRewriteFunction"),
          apiBehavior("/event/realtime*", "appsync-events-origin"),
          adminArtifactBehavior("/admin/docs/*", "admin-artifacts-origin", "CloudFrontAdminArtifactRewriteFunction"),
          adminArtifactBehavior("/admin/test-reports/*", "admin-artifacts-origin", "CloudFrontAdminArtifactRewriteFunction"),
          adminArtifactBehavior("/admin/evaluation-reports/*", "admin-artifacts-origin", "CloudFrontAdminArtifactRewriteFunction"),
          spaBehavior("spa-origin", "CloudFrontViewerRouter", "/chat/*"),
          spaBehavior("spa-origin", "CloudFrontViewerRouter", "/admin/*")
        ],
        WebACLId: cdk.Fn.getAtt("WebAcl", "Arn")
      }
    });
    this.docusaurusLatestUrl = cdk.Fn.join("", ["https://", this.distributionDomainName, "/admin/docs/latest/"]);
    this.allureLatestUrl = cdk.Fn.join("", ["https://", this.distributionDomainName, "/admin/test-reports/allure/latest/"]);
  }
}

export class IdentityConstruct extends Construct {
  readonly userPoolId = cdk.Fn.ref("UserPool");
  readonly userPoolClientId = cdk.Fn.ref("UserPoolClient");

  constructor(scope: Construct, id: string, props: IdentityConstructProps) {
    super(scope, id);
    cfn(this, "UserPool", "AWS::Cognito::UserPool", {
      UserPoolName: `saphnexa-${props.envName}`,
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: true },
      MfaConfiguration: "OPTIONAL",
      UserPoolAddOns: { AdvancedSecurityMode: "ENFORCED" },
      Schema: [{ Name: "email", Required: true, Mutable: true }]
    });
    cfn(this, "UserPoolClient", "AWS::Cognito::UserPoolClient", {
      UserPoolId: this.userPoolId,
      GenerateSecret: true,
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthFlows: ["code"],
      AllowedOAuthScopes: ["openid", "email", "profile"],
      CallbackURLs: [cdk.Fn.join("", [props.viewerBaseUrl, "/auth/callback"])],
      LogoutURLs: [cdk.Fn.join("", [props.viewerBaseUrl, "/auth/logout"])],
      SupportedIdentityProviders: ["COGNITO"],
      ExplicitAuthFlows: ["ALLOW_REFRESH_TOKEN_AUTH"]
    });
    cfn(this, "UserPoolDomain", "AWS::Cognito::UserPoolDomain", {
      Domain: cdk.Fn.sub("saphnexa-${AWS::AccountId}-${AWS::Region}-${EnvName}", { EnvName: props.envName }),
      UserPoolId: this.userPoolId
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

  constructor(scope: Construct, id: string, _props?: SaphnexaConstructProps) {
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

  constructor(scope: Construct, id: string, _props?: SaphnexaConstructProps) {
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
    cfn(this, "ChatChannelNamespace", "AWS::AppSync::ChannelNamespace", {
      ApiId: cdk.Fn.getAtt("EventApi", "ApiId"),
      Name: "chat",
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

  constructor(scope: Construct, id: string, _props?: SaphnexaConstructProps) {
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

function cloudFrontOnlyBucketPolicy(bucketName: string, distributionArn: string) {
  return {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowCloudFrontServicePrincipalReadOnly",
        Effect: "Allow",
        Principal: { Service: "cloudfront.amazonaws.com" },
        Action: "s3:GetObject",
        Resource: [`arn:aws:s3:::${bucketName}/*`],
        Condition: { StringEquals: { "AWS:SourceArn": distributionArn } }
      },
      {
        Sid: "DenyInsecureTransport",
        Effect: "Deny",
        Principal: "*",
        Action: "s3:*",
        Resource: [`arn:aws:s3:::${bucketName}`, `arn:aws:s3:::${bucketName}/*`],
        Condition: { Bool: { "aws:SecureTransport": false } }
      }
    ]
  };
}

function originAccessControl(name: string) {
  return { OriginAccessControlConfig: { Name: `saphnexa-${name}`, OriginAccessControlOriginType: "s3", SigningBehavior: "always", SigningProtocol: "sigv4" } };
}

function cloudFrontFunction(name: string, code: string) {
  return { Name: `saphnexa-${name}`, AutoPublish: true, FunctionCode: code, FunctionConfig: { Runtime: "cloudfront-js-2.0", Comment: name } };
}

function visibilityConfig(name: string) {
  return { CloudWatchMetricsEnabled: true, MetricName: name, SampledRequestsEnabled: true };
}

function s3Origin(id: string, domainName: string, originAccessControlId: string) {
  return { Id: id, DomainName: domainName, OriginAccessControlId: originAccessControlId, S3OriginConfig: { OriginAccessIdentity: "" } };
}

function httpOrigin(id: string, domainName: string) {
  return {
    Id: id,
    DomainName: domainName,
    CustomOriginConfig: {
      OriginProtocolPolicy: "https-only",
      OriginSSLProtocols: ["TLSv1.2"],
      HTTPPort: 80,
      HTTPSPort: 443
    }
  };
}

function domainNameFromUrl(value: string) {
  return cdk.Fn.select(2, cdk.Fn.split("/", value));
}

function spaBehavior(targetOriginId: string, functionLogicalId: string, pathPattern?: string) {
  return cacheBehavior(targetOriginId, {
    PathPattern: pathPattern,
    FunctionAssociations: [viewerRequestFunctionAssociation(functionLogicalId)],
    Compress: true,
    AllowedMethods: ["GET", "HEAD", "OPTIONS"],
    CachedMethods: ["GET", "HEAD", "OPTIONS"],
    CachePolicyId: managedCachePolicy("CachingOptimized")
  });
}

function apiBehavior(pathPattern: string, targetOriginId: string, functionLogicalId?: string) {
  return cacheBehavior(targetOriginId, {
    PathPattern: pathPattern,
    FunctionAssociations: functionLogicalId ? [viewerRequestFunctionAssociation(functionLogicalId)] : [],
    AllowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
    CachedMethods: ["GET", "HEAD", "OPTIONS"],
    CachePolicyId: managedCachePolicy("CachingDisabled"),
    OriginRequestPolicyId: managedOriginRequestPolicy("AllViewerExceptHostHeader")
  });
}

function adminArtifactBehavior(pathPattern: string, targetOriginId: string, functionLogicalId: string) {
  return cacheBehavior(targetOriginId, {
    PathPattern: pathPattern,
    FunctionAssociations: [viewerRequestFunctionAssociation(functionLogicalId)],
    TrustedKeyGroups: [cdk.Fn.ref("AdminArtifactsKeyGroup")],
    Compress: true,
    AllowedMethods: ["GET", "HEAD", "OPTIONS"],
    CachedMethods: ["GET", "HEAD", "OPTIONS"],
    CachePolicyId: managedCachePolicy("CachingOptimized")
  });
}

function cacheBehavior(targetOriginId: string, overrides: Record<string, unknown>) {
  return {
    TargetOriginId: targetOriginId,
    ViewerProtocolPolicy: "redirect-to-https",
    ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined))
  };
}

function viewerRequestFunctionAssociation(functionLogicalId: string) {
  return { EventType: "viewer-request", FunctionARN: cdk.Fn.getAtt(functionLogicalId, "FunctionMetadata.FunctionARN") };
}

function managedCachePolicy(name: "CachingDisabled" | "CachingOptimized") {
  const ids = {
    CachingDisabled: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
    CachingOptimized: "658327ea-f89d-4fab-a63d-7e88639e58f6"
  };
  return ids[name];
}

function managedOriginRequestPolicy(name: "AllViewerExceptHostHeader") {
  const ids = { AllViewerExceptHostHeader: "b689b0a8-53d0-40ab-baf2-68738e2966ac" };
  return ids[name];
}

function managedRule(name: string, priority: number) {
  return {
    Name: name,
    Priority: priority,
    OverrideAction: { None: {} },
    Statement: { ManagedRuleGroupStatement: { VendorName: "AWS", Name: name } },
    VisibilityConfig: visibilityConfig(name)
  };
}

function rateLimitRule(name: string, priority: number, limit: number) {
  return {
    Name: name,
    Priority: priority,
    Action: { Block: {} },
    Statement: { RateBasedStatement: { Limit: limit, AggregateKeyType: "IP" } },
    VisibilityConfig: visibilityConfig(name)
  };
}

function viewerRouterFunctionCode() {
  return `function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri === "/") {
    request.uri = "/chat/index.html";
  } else if (uri === "/chat" || uri.indexOf("/chat/") === 0) {
    request.uri = "/chat/index.html";
  } else if (uri === "/admin" || uri.indexOf("/admin/") === 0) {
    request.uri = "/admin/index.html";
  }
  return request;
}`;
}

function apiVersionRewriteFunctionCode() {
  return `function handler(event) {
  var request = event.request;
  if (request.uri.indexOf("/api/") === 0) {
    request.uri = request.uri.replace("/api/", "/v1/");
  } else if (request.uri.indexOf("/auth/") === 0) {
    request.uri = request.uri.replace("/auth/", "/v1/auth/");
  }
  return request;
}`;
}

function adminArtifactRewriteFunctionCode() {
  return `function handler(event) {
  var request = event.request;
  if (request.uri.indexOf("/admin/docs/latest/") === 0) {
    request.uri = request.uri.replace("/admin/docs/latest/", "/docs-site/latest/");
  } else if (request.uri.indexOf("/admin/docs/versions/") === 0) {
    request.uri = request.uri.replace("/admin/docs/versions/", "/docs-site/releases/");
  } else if (request.uri.indexOf("/admin/test-reports/allure/") === 0) {
    request.uri = request.uri.replace("/admin/test-reports/allure/", "/test-reports/allure/");
  } else if (request.uri.indexOf("/admin/evaluation-reports/") === 0) {
    request.uri = request.uri.replace("/admin/evaluation-reports/", "/reports/evaluations/");
  }
  return request;
}`;
}
