import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Safely convert Prisma Decimal or number to number */
export function toNumber(val: unknown): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  if (val && typeof val === "object") {
    const v = val as { toNumber?: () => number; toString?: () => string };
    if (typeof v.toNumber === "function") return v.toNumber();
    if (typeof v.toString === "function") return parseFloat(v.toString()) || 0;
  }
  return 0;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function getDaysUntilDue(dueDate: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Card shape suitable for passing to Client Components (no Decimals) */
export type SerializedCard = {
  id: string;
  cardName: string;
  issuerName: string;
  lastFourDigits: string | null;
  creditLimit: number;
  currentBalance: number;
  minimumDue: number;
  fullDue: number;
  dueDate: string;
  statementDate: string;
  createdAt: string;
  [key: string]: unknown;
};

/** Serialize a card for passing to Client Components (converts Decimals to numbers) */
export function serializeCard<T extends Record<string, unknown>>(card: T): SerializedCard {
  const result = {
    ...card,
    creditLimit: toNumber(card.creditLimit),
    currentBalance: toNumber(card.currentBalance),
    minimumDue: toNumber(card.minimumDue),
    fullDue: toNumber(card.fullDue),
    dueDate: card.dueDate instanceof Date ? card.dueDate.toISOString() : String(card.dueDate ?? ""),
    statementDate: card.statementDate instanceof Date ? (card.statementDate as Date).toISOString() : String(card.statementDate ?? ""),
    createdAt: card.createdAt instanceof Date ? (card.createdAt as Date).toISOString() : String(card.createdAt ?? ""),
  };
  return result as unknown as SerializedCard;
}

export function getCardStatus(
  dueDate: Date | string,
  utilizationPercent: number
): "overdue" | "due_soon" | "paid" | "high_utilization" | "ok" {
  const daysUntilDue = getDaysUntilDue(dueDate);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "due_soon";
  if (utilizationPercent >= 70) return "high_utilization";
  if (utilizationPercent >= 30 && daysUntilDue <= 7) return "due_soon";

  return "ok";
}
