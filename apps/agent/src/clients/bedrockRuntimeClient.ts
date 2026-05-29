import type { Evidence } from "../schemas/evidence";

export interface BedrockRuntimeClient {
  generateGroundedAnswer(input: { question: string; context: string; evidence: Evidence[] }): Promise<{ answer_text: string }>;
}

export function createUnavailableBedrockRuntimeClient(): BedrockRuntimeClient {
  return {
    async generateGroundedAnswer() {
      return { answer_text: "" };
    }
  };
}
