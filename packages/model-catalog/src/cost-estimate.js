export const localCostEstimate = {
  assumption: "50 DAU, 10 questions/user/day, local planning estimate before AWS Pricing Calculator evidence.",
  monthly_usd: 420,
  line_items: [
    { service: "CloudFront/S3", monthly_usd: 35 },
    { service: "API/Lambda/SQS/AppSync", monthly_usd: 80 },
    { service: "Aurora DSQL", monthly_usd: 120 },
    { service: "Bedrock models and KB", monthly_usd: 170 },
    { service: "CloudWatch and security", monthly_usd: 15 }
  ]
};
