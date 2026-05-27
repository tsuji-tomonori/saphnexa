export const RealtimeConstruct = {
  name: "RealtimeConstruct",
  resources: ["AppSyncEvents", "ChannelNamespaces", "SubscribeHandler", "PublishHandler"],
  outputs: ["realtimeEndpoint", "httpEndpoint", "namespaceNames"],
  channelPolicyIntent: {
    ticketTtlSeconds: 60,
    ticketSingleUse: true,
    userScopedPattern: "/users/{user_id}/chat/*",
    subscribeAuthorizer: "ws-ticket",
    publishSources: ["chat-worker", "admin-worker"]
  }
};
