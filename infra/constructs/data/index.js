export const DataConstruct = {
  name: "DataConstruct",
  resources: ["AuroraDsql", "S3Buckets", "S3Vectors", "KmsKey", "BucketPolicies"],
  outputs: ["dsqlEndpoint", "bucketArns", "vectorIndexArn", "kmsKeyArn"]
};
