import Link from "next/link";
import { formatCurrency, getDaysUntilDue, toNumber } from "@/lib/utils";
import { getUtilizationLevel, paymentToReachUtilization } from "@/lib/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CardData = {
  id: string;
  cardName: string;
  currentBalance: unknown;
  creditLimit: unknown;
  fullDue: unknown;
  dueDate: Date | string;
};

export function RecommendedActions({ cards }: { cards: CardData[] }) {
  const actions: { text: string; href: string; priority: number }[] = [];

  for (const card of cards) {
    const balance = toNumber(card.currentBalance);
    const limit = toNumber(card.creditLimit);
    const due = toNumber(card.fullDue);
    const util = limit > 0 ? (balance / limit) * 100 : 0;
    const days = getDaysUntilDue(card.dueDate);
    const utilLevel = getUtilizationLevel(util);

    if (days < 0) {
      actions.push({
        text: `Pay ${formatCurrency(due)} on ${card.cardName} — overdue ${Math.abs(days)} days`,
        href: `/cards/${card.id}/history`,
        priority: 1,
      });
    } else if (days <= 7) {
      actions.push({
        text: `Pay ${formatCurrency(due)} before due date to avoid late fee`,
        href: `/cards/${card.id}/history`,
        priority: 2,
      });
    }

    if (utilLevel === "high" || utilLevel === "risky") {
      const pay = paymentToReachUtilization(balance, limit, 50);
      if (pay > 0) {
        actions.push({
          text: `Pay ${formatCurrency(pay)} on ${card.cardName} to reduce utilization below 50%`,
          href: `/cards/${card.id}/history`,
          priority: utilLevel === "risky" ? 1 : 3,
        });
      }
      if (util >= 70) {
        actions.push({
          text: `Avoid using ${card.cardName} until balance drops below 30% utilization`,
          href: `/cards/${card.id}`,
          priority: 4,
        });
      }
    }
  }

  const sorted = actions.sort((a, b) => a.priority - b.priority).slice(0, 5);

  if (sorted.length === 0) {
    return (
      <Card className="border-amber-200/50 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">You&apos;re on track. No urgent actions needed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Recommended Actions</CardTitle>
        <p className="text-sm text-slate-500">Suggested next steps</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {sorted.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1 shrink-0 text-slate-400">•</span>
              <div className="flex-1">
                <p className="text-slate-700">{action.text}</p>
                <Link href={action.href}>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-teal-600 hover:bg-transparent">
                    Take action →
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
