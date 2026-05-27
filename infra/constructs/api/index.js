export const ApiConstruct = {
  name: "ApiConstruct",
  resources: ["HttpApi", "HonoApiLambda", "ToolsApiLambda", "ApiAccessLogs"],
  outputs: ["apiEndpoint", "apiLambdaArn", "toolsApiEndpoint", "toolsLambdaArn"]
};
