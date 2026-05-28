import { specByConstructName } from "../../cdk/resource-specs.js";

const spec = specByConstructName("EdgeStaticConstruct");

export const EdgeStaticConstruct = {
  name: "EdgeStaticConstruct",
  resources: ["CloudFront", "WAF", "S3SpaBucket", "AdminArtifactsBucket", "CloudFrontFunctions", "OAC"],
  cfnResourceTypes: spec.resources.map((item) => item.type),
  cfnResources: spec.resources,
  outputs: ["distributionId", "distributionDomainName", "spaBucketArn", "adminArtifactsBucketArn", "signedCookieKeyGroupId"],
  cfnOutputs: spec.outputs,
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
