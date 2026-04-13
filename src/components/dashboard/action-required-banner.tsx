import Link from "next/link";
import { formatCurrency, getDaysUntilDue, toNumber } from "@/lib/utils";
import { getUtilizationLevel, paymentToReachUtilization } from "@/lib/dashboard-utils";
import { Button } from "@/components/ui/button";

type CardData = {
  id: string;
  cardName: string;
  issuerName: string;
  lastFourDigits: string | null;
  currentBalance: unknown;
  creditLimit: unknown;
  fullDue: unknown;
  minimumDue?: unknown;
  dueDate: Date | string;
};

export function ActionRequiredBanner({ cards }: { cards: CardData[] }) {
  const totalBalance = cards.reduce((s, c) => s + toNumber(c.currentBalance), 0);
  const totalLimit = cards.reduce((s, c) => s + toNumber(c.creditLimit), 0);
  const overallUtil = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  // Find most urgent: overdue first, then due soon (<=7 days), then high utilization
  const withMeta = cards.map((c) => {
    const balance = toNumber(c.currentBalance);
    const limit = toNumber(c.creditLimit);
    const due = toNumber(c.fullDue);
    const util = limit > 0 ? (balance / limit) * 100 : 0;
    const days = getDaysUntilDue(c.dueDate);
    const utilLevel = getUtilizationLevel(util);
    return { ...c, balance, limit, due, util, days, utilLevel };
  });

  const overdue = withMeta.find((c) => c.days < 0);
  const dueSoon = withMeta.filter((c) => c.days >= 0 && c.days <= 7).sort((a, b) => a.days - b.days)[0];
  const highUtil = withMeta.find((c) => c.utilLevel === "high" || c.utilLevel === "risky");

  const primary = overdue || dueSoon || highUtil;
  const suggestedPayment = highUtil
    ? paymentToReachUtilization(highUtil.balance, highUtil.limit, 30)
    : 0;
  const dueDate = primary?.dueDate ? new Date(primary.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  if (cards.length === 0 || (!primary && overallUtil < 30)) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xl">
            ⚠
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">Action Required</h3>
            <div className="mt-1 space-y-0.5 text-sm text-slate-700">
              {overdue && (
                <p>
                  <strong>{overdue.cardName}</strong> payment {formatCurrency(overdue.due)} is{" "}
                  <span className="font-medium text-red-600">
                    {Math.abs(overdue.days)} days overdue
                  </span>
                </p>
              )}
              {!overdue && dueSoon && (
                <p>
                  <strong>{dueSoon.cardName}</strong> payment {formatCurrency(dueSoon.due)} due in{" "}
                  <span className="font-medium text-amber-700">
                    {dueSoon.days} {dueSoon.days === 1 ? "day" : "days"}
                  </span>{" "}
                  ({dueDate})
                </p>
              )}
              {highUtil && (overdue || dueSoon ? (
                <p>Utilization {highUtil.util.toFixed(0)}% (recommended &lt;30%)</p>
              ) : (
                <p>
                  <strong>{highUtil.cardName}</strong> utilization {highUtil.util.toFixed(0)}% (recommended &lt;30%)
                </p>
              ))}
              {suggestedPayment > 0 && highUtil && (
                <p className="text-teal-700">
                  Suggested payment: {formatCurrency(suggestedPayment)} to reach safe utilization
                </p>
              )}
            </div>
          </div>
        </div>
        <Link href={primary ? `/cards/${primary.id}/history` : "/cards/add"}>
          <Button size="sm" className="shrink-0 bg-teal-600 hover:bg-teal-700">
            {overdue || dueSoon ? "Record Payment" : highUtil ? "Pay Balance" : "Add Card"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
