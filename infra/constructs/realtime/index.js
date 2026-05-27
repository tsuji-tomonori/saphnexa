export const RealtimeConstruct = {
  name: "RealtimeConstruct",
  resources: ["AppSyncEvents", "ChannelNamespaces", "SubscribeHandler", "PublishHandler"],
  outputs: ["realtimeEndpoint", "httpEndpoint", "namespaceNames"]
};
