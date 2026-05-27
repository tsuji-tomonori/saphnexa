import { synthLocalInventory } from "../infra/bin/app.js";
import { assert } from "./lib.js";

const inventory = synthLocalInventory("dev");
assert(inventory.region === "ap-northeast-1", "CDK inventory must target ap-northeast-1");
assert(inventory.construct_count === 7, "CDK inventory must contain 7 constructs");
for (const construct of ["EdgeStaticConstruct", "IdentityConstruct", "ApiConstruct", "RealtimeConstruct", "DataConstruct", "RagProcessingConstruct", "ObservabilityCicdConstruct"]) {
  assert(inventory.constructs.includes(construct), `missing construct ${construct}`);
}

console.log("local CDK synth inventory check passed");
