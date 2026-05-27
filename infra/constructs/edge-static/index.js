export const EdgeStaticConstruct = {
  name: "EdgeStaticConstruct",
  resources: ["CloudFront", "WAF", "S3SpaBucket", "AdminArtifactsBucket", "CloudFrontFunctions", "OAC"],
  outputs: ["distributionId", "distributionDomainName", "spaBucketArn", "adminArtifactsBucketArn", "signedCookieKeyGroupId"],
  edgeRoutingIntent: {
    singleEntryOrigin: "cloudfront",
    originAccess: "oac-only",
    viewerRequestFunction: "saphnexa-viewer-router",
    internalApiPrefix: "/api/",
    authPrefix: "/auth/",
    spaFallback: "/chat/index.html",
    adminArtifactPrefixes: ["/admin/docs/", "/admin/test-reports/"],
    signedCookieRequiredPrefixes: ["/admin/docs/", "/admin/test-reports/"],
    wafAttached: true
  }
};
