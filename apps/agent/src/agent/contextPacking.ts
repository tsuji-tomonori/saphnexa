import type { Evidence } from "../schemas/evidence";

export interface PackedContext {
  context: string;
  evidence: Evidence[];
  token_budget: number;
}

export function packContext(evidence: Evidence[], tokenBudget = 1800): PackedContext {
  const selected = evidence.filter((item) => item.text.trim().length > 0);
  return {
    evidence: selected,
    token_budget: tokenBudget,
    context: selected.map((item, index) => `[${index + 1}] ${item.text}`).join("\n")
  };
}
