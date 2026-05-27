export const ObservabilityCicdConstruct = {
  name: "ObservabilityCicdConstruct",
  resources: ["CloudWatchLogGroups", "CloudWatchDashboard", "CloudWatchAlarms", "EventBridgeBus", "GitHubDeployRoles", "CdkNag"],
  outputs: ["logGroupName", "dashboardName", "deployRoleArn", "eventBusName"]
};
