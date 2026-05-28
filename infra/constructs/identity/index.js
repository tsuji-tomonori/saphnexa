import { specByConstructName } from "../../cdk/resource-specs.js";
import { edgeIdentityRealtimeBindings } from "../../cdk/edge-identity-realtime-bindings.js";

const spec = specByConstructName("IdentityConstruct");

export const IdentityConstruct = {
  name: "IdentityConstruct",
  resources: ["CognitoUserPool", "CognitoUserPoolClient", "CognitoGroups", "GitHubOidcProvider"],
  cfnResourceTypes: spec.resources.map((item) => item.type),
  cfnResources: spec.resources,
  outputs: ["userPoolId", "clientId", "issuer", "adminGroupName"],
  cfnOutputs: spec.outputs,
  cognitoBindingIntent: edgeIdentityRealtimeBindings.cognito
};
