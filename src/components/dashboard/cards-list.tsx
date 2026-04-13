import Link from "next/link";
import { formatCurrency, getDaysUntilDue, getCardStatus, toNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardStatusBadge } from "./card-status-badge";

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

export function CardsList({ cards }: { cards: CardData[] }) {
  if (cards.length === 0) {
    return (
      <Card className="border-amber-200/50 border-dashed bg-white">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-amber-100/80 p-4">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-900">No cards yet</h3>
          <p className="mt-1 text-sm text-slate-500">Add your first credit card to get started.</p>
          <Link href="/cards/add">
            <Button className="mt-6">Add Card</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
        {cards.map((card) => {
          const balance = toNumber(card.currentBalance);
          const limit = toNumber(card.creditLimit);
          const due = toNumber(card.fullDue);
          const utilization = limit > 0 ? (balance / limit) * 100 : 0;
          const daysUntilDue = getDaysUntilDue(card.dueDate);
          const status = getCardStatus(card.dueDate, utilization);

          return (
            <Card key={card.id} className="overflow-hidden border-amber-200/50 bg-white shadow-sm transition-all hover:shadow-md">
              <CardHeader className="space-y-1 pb-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{card.cardName}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {card.issuerName}
                      {card.lastFourDigits && ` •••• ${card.lastFourDigits}`}
                    </p>
                  </div>
                  <CardStatusBadge status={status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Balance</span>
                  <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Due</span>
                  <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(due)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Due Date</span>
                  <span className="font-medium text-slate-700">
                    {daysUntilDue < 0
                      ? `${Math.abs(daysUntilDue)} days overdue`
                      : daysUntilDue === 0
                        ? "Today"
                        : `${daysUntilDue} days`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Utilization</span>
                  <span className={`font-medium tabular-nums ${
                    utilization >= 75 ? "text-red-600" : utilization >= 50 ? "text-orange-600" : utilization >= 30 ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    {utilization.toFixed(1)}% {utilization >= 75 ? "🔴" : utilization >= 50 ? "🟠" : utilization >= 30 ? "🟡" : "🟢"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Link href={`/cards/${card.id}/history`} className="flex-1 min-w-[100px]">
                    <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700">
                      Record Payment
                    </Button>
                  </Link>
                  <Link href={`/cards/${card.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Link href={`/cards/${card.id}/history`}>
                    <Button variant="ghost" size="sm">History</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
