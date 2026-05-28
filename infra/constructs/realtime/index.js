import { specByConstructName } from "../../cdk/resource-specs.js";

const spec = specByConstructName("RealtimeConstruct");

export const RealtimeConstruct = {
  name: "RealtimeConstruct",
  resources: ["AppSyncEvents", "ChannelNamespaces", "SubscribeHandler", "PublishHandler"],
  cfnResourceTypes: spec.resources.map((item) => item.type),
  cfnResources: spec.resources,
  outputs: ["realtimeEndpoint", "httpEndpoint", "namespaceNames"],
  cfnOutputs: spec.outputs,
  channelPolicyIntent: {
    ticketTtlSeconds: 60,
    ticketSingleUse: true,
    userScopedPattern: "/users/{user_id}/chat/*",
    subscribeAuthorizer: "ws-ticket",
    publishSources: ["chat-worker", "admin-worker"]
  }
};
