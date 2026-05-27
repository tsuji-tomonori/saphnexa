import { saphnexaConstructs } from "../stacks/saphnexa-app-stack.js";
import { saphnexaEnvironmentConfig } from "../config/environment.js";

export function synthLocalInventory(env = "dev") {
  return {
    env,
    region: saphnexaEnvironmentConfig.defaultRegion,
    construct_count: saphnexaConstructs.length,
    constructs: saphnexaConstructs.map((item) => item.name)
  };
}
