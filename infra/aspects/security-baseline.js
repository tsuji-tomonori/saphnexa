export const securityBaselineRules = [
  "S3 Block Public Access must be enabled.",
  "S3 buckets must use SSE-KMS.",
  "CloudFront must attach WAF.",
  "IAM wildcard actions require explicit review.",
  "cdk-nag findings must be reviewed before deployment.",
  "SQS queues must attach DLQs.",
  "CloudWatch log retention must be finite."
];
