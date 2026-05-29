export interface CostEstimateLineItem {
  service: string;
  monthly_usd: number;
}

export interface LocalCostEstimate {
  assumption: string;
  monthly_usd: number;
  line_items: CostEstimateLineItem[];
}

export const costEstimateSchemaVersion = "local-cost-estimate.v1" as const;
