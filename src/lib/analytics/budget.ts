import { GeoPulseReport } from "@/lib/types";

export interface BudgetStatus {
  scope: string;
  period: string;
  used: number;
  hardLimit: number;
  remaining: number;
  pct: number;
  level: "ok" | "warning" | "critical";
}

export function computeBudgets(report: GeoPulseReport): BudgetStatus[] {
  const list = report.budgets ?? [];
  return list.map((b) => {
    const pct = b.hardLimit ? b.used / b.hardLimit : 0;
    const level: BudgetStatus["level"] = pct >= 0.95 ? "critical" : pct >= 0.8 ? "warning" : "ok";
    return { ...b, pct, level };
  });
}
