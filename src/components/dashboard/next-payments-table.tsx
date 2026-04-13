import Link from "next/link";
import { formatCurrency, getDaysUntilDue, toNumber } from "@/lib/utils";
import { getCardStatus } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CardData = {
  id: string;
  cardName: string;
  issuerName: string;
  lastFourDigits: string | null;
  currentBalance: unknown;
  creditLimit: unknown;
  fullDue: unknown;
  dueDate: Date | string;
};

const statusDisplay: Record<string, { label: string; className: string }> = {
  overdue: { label: "⚠ Overdue", className: "text-red-600 font-medium" },
  due_soon: { label: "⚠ Due Soon", className: "text-amber-600 font-medium" },
  high_utilization: { label: "High Risk", className: "text-orange-600" },
  ok: { label: "Upcoming", className: "text-slate-500" },
};

export function NextPaymentsTable({ cards }: { cards: CardData[] }) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const upcoming = cards
    .map((c) => {
      const balance = toNumber(c.currentBalance);
      const limit = toNumber(c.creditLimit);
      const util = limit > 0 ? (balance / limit) * 100 : 0;
      const days = getDaysUntilDue(c.dueDate);
      const status = getCardStatus(c.dueDate, util);
      return { ...c, days, status };
    })
    .filter((c) => c.days <= 31)
    .sort((a, b) => a.days - b.days);

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Upcoming Payments</CardTitle>
          <Link href="/cards/add">
            <Button variant="ghost" size="sm">Add Card</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No payments due in the next 31 days</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Card</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 pr-4 font-medium">Due</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((card) => {
                  const due = new Date(card.dueDate);
                  const dueStr = `${monthNames[due.getMonth()]} ${due.getDate()}`;
                  const config = statusDisplay[card.status] || statusDisplay.ok;
                  return (
                    <tr key={card.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4">
                        <Link href={`/cards/${card.id}/history`} className="font-medium text-slate-900 hover:text-teal-600">
                          {card.cardName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-semibold tabular-nums">
                        {formatCurrency(toNumber(card.fullDue))}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{dueStr}</td>
                      <td className={`py-3 ${config.className}`}>{config.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
