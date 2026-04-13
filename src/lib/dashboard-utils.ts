import { formatCurrency, getDaysUntilDue, toNumber } from "./utils";

export type CardWithUtil = {
  id: string;
  cardName: string;
  issuerName: string;
  lastFourDigits: string | null;
  currentBalance: unknown;
  creditLimit: unknown;
  minimumDue?: unknown;
  fullDue: unknown;
  dueDate: Date;
};

export function getUtilizationLevel(util: number): "healthy" | "moderate" | "high" | "risky" {
  if (util < 30) return "healthy";
  if (util < 50) return "moderate";
  if (util < 75) return "high";
  return "risky";
}

export function getUtilizationLabel(util: number): string {
  const level = getUtilizationLevel(util);
  const labels = { healthy: "Healthy", moderate: "Moderate", high: "High", risky: "Risky" };
  return labels[level];
}

export function getUtilizationColor(util: number): string {
  const level = getUtilizationLevel(util);
  const colors = {
    healthy: "text-emerald-600",
    moderate: "text-amber-600",
    high: "text-orange-600",
    risky: "text-red-600",
  };
  return colors[level];
}

export function getUtilizationBgColor(util: number): string {
  const level = getUtilizationLevel(util);
  const colors = {
    healthy: "bg-emerald-500",
    moderate: "bg-amber-500",
    high: "bg-orange-500",
    risky: "bg-red-500",
  };
  return colors[level];
}

/** Payment needed to bring utilization to target (e.g. 30%) */
export function paymentToReachUtilization(
  balance: number,
  limit: number,
  targetUtil: number
): number {
  if (limit <= 0) return 0;
  const targetBalance = limit * (targetUtil / 100);
  const payment = balance - targetBalance;
  return Math.max(0, Math.min(payment, balance));
}
