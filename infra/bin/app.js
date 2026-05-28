import { saphnexaConstructs } from "../stacks/saphnexa-app-stack.js";
import { saphnexaEnvironmentConfig } from "../config/environment.js";

export function synthLocalInventory(env = "dev") {
  return {
    env,
    region: saphnexaEnvironmentConfig.defaultRegion,
    construct_count: saphnexaConstructs.length,
    constructs: saphnexaConstructs.map((item) => item.name),
    intent_catalog: Object.fromEntries(saphnexaConstructs.map((item) => [item.name, {
      resources: item.resources,
      cfnResourceTypes: item.cfnResourceTypes || [],
      cfnResources: item.cfnResources || [],
      outputs: item.outputs,
      cfnOutputs: item.cfnOutputs || [],
      edgeRoutingIntent: item.edgeRoutingIntent || null,
      cognitoBindingIntent: item.cognitoBindingIntent || null,
      channelPolicyIntent: item.channelPolicyIntent || null,
      ragRuntimeIntent: item.ragRuntimeIntent || null,
      kmsPolicyIntent: item.kmsPolicyIntent || null,
      queuePolicyIntent: item.queuePolicyIntent || null,
      iamReviewIntent: item.iamReviewIntent || null
    }]))
  };
}
