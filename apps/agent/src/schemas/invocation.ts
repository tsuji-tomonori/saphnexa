import { z } from "zod";

export const RetrievalPolicySchema = z.object({
  top_k: z.number().int().positive().max(20).default(10),
  allowed_acl_scope_ids: z.array(z.string()).default([])
});

export const AgentInvocationSchema = z.object({
  invocation_id: z.string(),
  user_id: z.string(),
  question: z.string().min(1),
  chat_id: z.string().optional(),
  retrieval_policy: RetrievalPolicySchema
});

export const AgentInvocationResultSchema = z.object({
  invocation_id: z.string(),
  status: z.enum(["accepted", "refused", "failed"]),
  answer: z.string().optional(),
  citations: z.array(z.object({
    document_id: z.string(),
    version_id: z.string().optional(),
    page: z.number().int().positive().optional()
  })).default([]),
  refusal_reason: z.string().optional()
});

export type RetrievalPolicy = z.infer<typeof RetrievalPolicySchema>;
export type AgentInvocation = z.infer<typeof AgentInvocationSchema>;
export type AgentInvocationResult = z.infer<typeof AgentInvocationResultSchema>;
