import { specByConstructName } from "../../cdk/resource-specs.js";

const spec = specByConstructName("ApiConstruct");

export const ApiConstruct = {
  name: "ApiConstruct",
  resources: ["HttpApi", "HonoApiLambda", "ToolsApiLambda", "ApiAccessLogs"],
  cfnResourceTypes: spec.resources.map((item) => item.type),
  cfnResources: spec.resources,
  outputs: ["apiEndpoint", "apiLambdaArn", "toolsApiEndpoint", "toolsLambdaArn"],
  cfnOutputs: spec.outputs
};
