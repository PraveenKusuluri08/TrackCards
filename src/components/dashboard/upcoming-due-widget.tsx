import Link from "next/link";
import { formatCurrency, getDaysUntilDue, toNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function UpcomingDueWidget({ cards }: { cards: CardData[] }) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in14Days = new Date(now);
  in14Days.setDate(in14Days.getDate() + 14);

  const upcoming = cards
    .map((card) => {
      const due = new Date(card.dueDate);
      due.setHours(0, 0, 0, 0);
      const daysUntilDue = getDaysUntilDue(card.dueDate);
      return { ...card, daysUntilDue };
    })
    .filter((c) => c.daysUntilDue >= 0 && c.daysUntilDue <= 14)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <Card className="border-amber-200/50 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Upcoming Due</CardTitle>
          <p className="text-sm text-slate-500">No payments due in the next 14 days</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Upcoming Due</CardTitle>
        <p className="text-sm text-slate-500">Payments due in the next 14 days</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.map((card) => (
          <Link
            key={card.id}
            href={`/cards/${card.id}/history`}
            className="block rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-teal-200 hover:bg-teal-50/30"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{card.cardName}</p>
                <p className="text-xs text-slate-500">
                  {card.issuerName}
                  {card.lastFourDigits && ` •••• ${card.lastFourDigits}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatCurrency(toNumber(card.fullDue))}
                </span>
                <span
                  className={
                    card.daysUntilDue <= 3
                      ? "text-xs font-medium text-amber-600"
                      : "text-xs text-slate-500"
                  }
                >
                  {card.daysUntilDue === 0
                    ? "Due today"
                    : card.daysUntilDue === 1
                      ? "Tomorrow"
                      : `${card.daysUntilDue} days`}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
