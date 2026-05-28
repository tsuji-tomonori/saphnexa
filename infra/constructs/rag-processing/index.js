import { specByConstructName } from "../../cdk/resource-specs.js";
import { ragRuntimeBindings } from "../../cdk/rag-runtime-bindings.js";

const spec = specByConstructName("RagProcessingConstruct");

export const RagProcessingConstruct = {
  name: "RagProcessingConstruct",
  resources: ["BedrockKnowledgeBase", "AgentCoreRuntime", "AgentCoreGateway", "StepFunctions", "SqsQueues", "Workers"],
  cfnResourceTypes: spec.resources.map((item) => item.type),
  cfnResources: spec.resources,
  outputs: ["knowledgeBaseId", "agentRuntimeArn", "gatewayId", "stateMachineArns", "queueUrls"],
  cfnOutputs: spec.outputs,
  ragRuntimeIntent: ragRuntimeBindings,
  queuePolicyIntent: {
    queues: ["ingestion", "evaluation", "event-delivery"],
    deadLetterQueues: ["ingestion-dlq", "evaluation-dlq", "event-delivery-dlq"],
    maxReceiveCount: 3,
    visibilityTimeoutSeconds: 960
  }
};
