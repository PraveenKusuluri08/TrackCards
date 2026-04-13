import Link from "next/link";
import { formatCurrency, toNumber } from "@/lib/utils";
import { getUtilizationLevel, paymentToReachUtilization } from "@/lib/dashboard-utils";
import { Button } from "@/components/ui/button";

type CardData = {
  id: string;
  cardName: string;
  currentBalance: unknown;
  creditLimit: unknown;
  dueDate?: Date | string;
};

export function InsightBanner({ cards }: { cards: CardData[] }) {
  const totalBalance = cards.reduce((s, c) => s + toNumber(c.currentBalance), 0);
  const totalLimit = cards.reduce((s, c) => s + toNumber(c.creditLimit), 0);
  const overallUtil = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  const level = getUtilizationLevel(overallUtil);

  if (level === "healthy" || cards.length === 0) return null;

  type CardWithUtil = CardData & { balance: number; limit: number; util: number };
  const worstCard: CardWithUtil | null = cards.length > 0
    ? cards.reduce<CardWithUtil>(
        (acc, c) => {
          const bal = toNumber(c.currentBalance);
          const lim = toNumber(c.creditLimit);
          const util = lim > 0 ? (bal / lim) * 100 : 0;
          return util > acc.util ? { ...c, balance: bal, limit: lim, util } : acc;
        },
        { ...cards[0], balance: toNumber(cards[0].currentBalance), limit: toNumber(cards[0].creditLimit), util: 0 }
      )
    : null;
  const suggestedPayment = worstCard ? paymentToReachUtilization(worstCard.balance, worstCard.limit, 50) : 0;

  const messages: Record<string, string> = {
    moderate: `Your utilization is ${overallUtil.toFixed(0)}%. Keeping it below 30% is ideal for credit health.`,
    high: `Your utilization is ${overallUtil.toFixed(0)}%, which may impact your credit score. Paying ${formatCurrency(suggestedPayment)} on ${worstCard?.cardName || "your card"} would reduce it below 50%.`,
    risky: `Your utilization is ${overallUtil.toFixed(0)}%, which can significantly impact your credit score. Prioritize paying down ${worstCard?.cardName || "your highest-balance card"} to reduce risk.`,
  };
  const message = messages[level] || messages.moderate;

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <p className="text-sm text-slate-700">
            <strong className="text-slate-900">Insight:</strong> {message}
          </p>
        </div>
        <Link href={worstCard ? `/cards/${worstCard.id}/history` : "/dashboard"}>
          <Button variant="outline" size="sm" className="shrink-0 border-teal-300 text-teal-700 hover:bg-teal-100">
            Take action
          </Button>
        </Link>
      </div>
    </div>
  );
}
