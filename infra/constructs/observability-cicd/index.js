import { specByConstructName } from "../../cdk/resource-specs.js";

const spec = specByConstructName("ObservabilityCicdConstruct");

export const ObservabilityCicdConstruct = {
  name: "ObservabilityCicdConstruct",
  resources: ["CloudWatchLogGroups", "CloudWatchDashboard", "CloudWatchAlarms", "EventBridgeBus", "GitHubDeployRoles", "CdkNag"],
  cfnResourceTypes: spec.resources.map((item) => item.type),
  cfnResources: spec.resources,
  outputs: ["logGroupName", "dashboardName", "deployRoleArn", "eventBusName"],
  cfnOutputs: spec.outputs,
  iamReviewIntent: {
    cdkNagEnabled: true,
    wildcardActionRequiresFinding: true,
    githubOidcDeployRoleScopedToRepo: true,
    permissionsBoundaryRequired: true
  }
};
