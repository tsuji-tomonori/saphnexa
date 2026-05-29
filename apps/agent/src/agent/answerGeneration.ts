import type { BedrockRuntimeClient } from "../clients/bedrockRuntimeClient";
import type { PackedContext } from "./contextPacking";

export async function generateAnswer(input: {
  question: string;
  packedContext: PackedContext;
  bedrock: BedrockRuntimeClient;
}) {
  if (input.packedContext.evidence.length === 0) {
    return {
      answer_text: "参照可能な資料内に回答の根拠が見つからないため、回答できません。",
      support_status: "insufficient_evidence" as const
    };
  }

  const generated = await input.bedrock.generateGroundedAnswer({
    question: input.question,
    context: input.packedContext.context,
    evidence: input.packedContext.evidence
  });

  return {
    answer_text: generated.answer_text || "根拠パックは作成済みですが、回答生成 runtime が未設定です。",
    support_status: "supported" as const
  };
}
