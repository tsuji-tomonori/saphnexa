import { specByConstructName } from "../../cdk/resource-specs.js";

const spec = specByConstructName("DataConstruct");

export const DataConstruct = {
  name: "DataConstruct",
  resources: ["AuroraDsql", "S3Buckets", "S3Vectors", "KmsKey", "BucketPolicies"],
  cfnResourceTypes: spec.resources.map((item) => item.type),
  cfnResources: spec.resources,
  outputs: ["dsqlEndpoint", "bucketArns", "vectorIndexArn", "kmsKeyArn"],
  cfnOutputs: spec.outputs,
  kmsPolicyIntent: {
    keyRotationEnabled: true,
    bucketEncryption: "SSE-KMS",
    allowedServicePrincipals: ["s3.amazonaws.com", "lambda.amazonaws.com"],
    deniedPublicAccess: true
  }
};
