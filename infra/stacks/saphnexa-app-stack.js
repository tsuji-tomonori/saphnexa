import { ApiConstruct } from "../constructs/api/index.js";
import { DataConstruct } from "../constructs/data/index.js";
import { EdgeStaticConstruct } from "../constructs/edge-static/index.js";
import { IdentityConstruct } from "../constructs/identity/index.js";
import { ObservabilityCicdConstruct } from "../constructs/observability-cicd/index.js";
import { RagProcessingConstruct } from "../constructs/rag-processing/index.js";
import { RealtimeConstruct } from "../constructs/realtime/index.js";

export const saphnexaConstructs = [
  EdgeStaticConstruct,
  IdentityConstruct,
  ApiConstruct,
  RealtimeConstruct,
  DataConstruct,
  RagProcessingConstruct,
  ObservabilityCicdConstruct
];
