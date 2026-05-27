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
      outputs: item.outputs,
      edgeRoutingIntent: item.edgeRoutingIntent || null,
      channelPolicyIntent: item.channelPolicyIntent || null,
      kmsPolicyIntent: item.kmsPolicyIntent || null,
      queuePolicyIntent: item.queuePolicyIntent || null,
      iamReviewIntent: item.iamReviewIntent || null
    }]))
  };
}
