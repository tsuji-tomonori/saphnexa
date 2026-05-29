import type { ToolsApiClient } from "../clients/toolsApiClient";
import type { Evidence } from "../schemas/evidence";

export async function bindCitations(input: {
  run_id: string;
  answer_text: string;
  evidence: Evidence[];
  tools: ToolsApiClient;
}) {
  if (input.evidence.length === 0) {
    return {
      answer_text: input.answer_text,
      citations: []
    };
  }
  return input.tools.citationFormat({
    run_id: input.run_id,
    answer_text: input.answer_text,
    evidence: input.evidence
  });
}
