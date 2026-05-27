export const RagProcessingConstruct = {
  name: "RagProcessingConstruct",
  resources: ["BedrockKnowledgeBase", "AgentCoreRuntime", "AgentCoreGateway", "StepFunctions", "SqsQueues", "Workers"],
  outputs: ["knowledgeBaseId", "agentRuntimeArn", "gatewayId", "stateMachineArns", "queueUrls"],
  queuePolicyIntent: {
    queues: ["ingestion", "evaluation", "event-delivery"],
    deadLetterQueues: ["ingestion-dlq", "evaluation-dlq", "event-delivery-dlq"],
    maxReceiveCount: 3,
    visibilityTimeoutSeconds: 300
  }
};
