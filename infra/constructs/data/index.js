export const DataConstruct = {
  name: "DataConstruct",
  resources: ["AuroraDsql", "S3Buckets", "S3Vectors", "KmsKey", "BucketPolicies"],
  outputs: ["dsqlEndpoint", "bucketArns", "vectorIndexArn", "kmsKeyArn"],
  kmsPolicyIntent: {
    keyRotationEnabled: true,
    bucketEncryption: "SSE-KMS",
    allowedServicePrincipals: ["s3.amazonaws.com", "lambda.amazonaws.com"],
    deniedPublicAccess: true
  }
};
