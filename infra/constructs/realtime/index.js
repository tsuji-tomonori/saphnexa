import { specByConstructName } from "../../cdk/resource-specs.js";
import { edgeIdentityRealtimeBindings } from "../../cdk/edge-identity-realtime-bindings.js";

const spec = specByConstructName("RealtimeConstruct");

export const RealtimeConstruct = {
  name: "RealtimeConstruct",
  resources: ["AppSyncEvents", "ChannelNamespaces", "SubscribeHandler", "PublishHandler"],
  cfnResourceTypes: spec.resources.map((item) => item.type),
  cfnResources: spec.resources,
  outputs: ["realtimeEndpoint", "httpEndpoint", "namespaceNames"],
  cfnOutputs: spec.outputs,
  channelPolicyIntent: {
    bindingSource: edgeIdentityRealtimeBindings.appSyncEvents,
    ticketTtlSeconds: 60,
    ticketSingleUse: true,
    userScopedPattern: "/{user_id}/chat/*",
    subscribeAuthorizer: "ws-ticket",
    publishSources: ["chat-worker", "admin-worker"]
  }
};
