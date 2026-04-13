import Link from "next/link";
import { formatCurrency, getDaysUntilDue, toNumber } from "@/lib/utils";
import { getUtilizationLevel } from "@/lib/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardData = {
  id: string;
  cardName: string;
  currentBalance: unknown;
  creditLimit: unknown;
  fullDue: unknown;
  dueDate: Date | string;
};

export function RiskAlerts({ cards }: { cards: CardData[] }) {
  const alerts: { text: string; href: string; severity: "high" | "medium" }[] = [];

  const totalBalance = cards.reduce((s, c) => s + toNumber(c.currentBalance), 0);
  const totalLimit = cards.reduce((s, c) => s + toNumber(c.creditLimit), 0);
  const availableCredit = totalLimit - totalBalance;
  const availablePct = totalLimit > 0 ? (availableCredit / totalLimit) * 100 : 100;

  for (const card of cards) {
    const balance = toNumber(card.currentBalance);
    const limit = toNumber(card.creditLimit);
    const util = limit > 0 ? (balance / limit) * 100 : 0;
    const days = getDaysUntilDue(card.dueDate);
    const utilLevel = getUtilizationLevel(util);

    if (utilLevel === "high" || utilLevel === "risky") {
      alerts.push({
        text: `${card.cardName} utilization above ${utilLevel === "risky" ? 75 : 50}%`,
        href: `/cards/${card.id}/history`,
        severity: utilLevel === "risky" ? "high" : "medium",
      });
    }
    if (days < 0) {
      alerts.push({
        text: `${card.cardName} payment overdue ${Math.abs(days)} days`,
        href: `/cards/${card.id}/history`,
        severity: "high",
      });
    }
  }

  if (availablePct < 20 && totalLimit > 0) {
    alerts.push({
      text: "Available credit low",
      href: "/dashboard",
      severity: "medium",
    });
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-amber-200/50 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span>✓</span> Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No risk alerts. You&apos;re on track.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span>⚠</span> Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {alerts.map((a, i) => (
            <li key={i}>
              <Link
                href={a.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${
                  a.severity === "high" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"
                }`}
              >
                {a.text}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
