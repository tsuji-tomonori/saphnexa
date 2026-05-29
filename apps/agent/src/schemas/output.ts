import { z } from "zod";
import { CitationSchema } from "./evidence";

export const AgentAnswerSchema = z.object({
  answer_text: z.string(),
  citations: z.array(CitationSchema),
  support_status: z.enum(["supported", "insufficient_evidence"])
});

export type AgentAnswer = z.infer<typeof AgentAnswerSchema>;
