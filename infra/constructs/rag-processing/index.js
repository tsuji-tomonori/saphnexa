export const RagProcessingConstruct = {
  name: "RagProcessingConstruct",
  resources: ["BedrockKnowledgeBase", "AgentCoreRuntime", "AgentCoreGateway", "StepFunctions", "SqsQueues", "Workers"],
  outputs: ["knowledgeBaseId", "agentRuntimeArn", "gatewayId", "stateMachineArns", "queueUrls"]
};
