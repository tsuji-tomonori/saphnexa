export const EdgeStaticConstruct = {
  name: "EdgeStaticConstruct",
  resources: ["CloudFront", "WAF", "S3SpaBucket", "AdminArtifactsBucket", "CloudFrontFunctions", "OAC"],
  outputs: ["distributionId", "distributionDomainName", "spaBucketArn", "adminArtifactsBucketArn", "signedCookieKeyGroupId"]
};
