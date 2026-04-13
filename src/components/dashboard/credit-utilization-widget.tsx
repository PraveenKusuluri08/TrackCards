import Link from "next/link";
import { formatCurrency, toNumber } from "@/lib/utils";
import { getUtilizationLabel, getUtilizationBgColor } from "@/lib/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardData = {
  id: string;
  cardName: string;
  issuerName: string;
  lastFourDigits: string | null;
  currentBalance: unknown;
  creditLimit: unknown;
};

export function CreditUtilizationWidget({ cards }: { cards: CardData[] }) {
  const withUtil = cards.map((card) => {
    const balance = toNumber(card.currentBalance);
    const limit = toNumber(card.creditLimit);
    const utilization = limit > 0 ? (balance / limit) * 100 : 0;
    return { ...card, balance, limit, utilization };
  });

  const totalBalance = withUtil.reduce((s, c) => s + c.balance, 0);
  const totalLimit = withUtil.reduce((s, c) => s + c.limit, 0);
  const overallUtil = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Credit Utilization</CardTitle>
        <p className="text-sm text-slate-500">Usage per card</p>
        <div className="pt-2">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-500">Overall: {overallUtil.toFixed(1)}%</span>
            <span className="font-medium text-slate-700">{getUtilizationLabel(overallUtil)}</span>
          </div>
          <div className="flex gap-1 text-[10px] text-slate-400">
            <span>0-30% 🟢</span><span>30-50% 🟡</span><span>50-75% 🟠</span><span>75%+ 🔴</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${getUtilizationBgColor(overallUtil)}`}
              style={{ width: `${Math.min(overallUtil, 100)}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {withUtil.map((card) => (
          <Link
            key={card.id}
            href={`/cards/${card.id}`}
            className="block"
          >
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-slate-700">{card.cardName}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {card.utilization.toFixed(0)}% {getUtilizationLabel(card.utilization)}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${getUtilizationBgColor(card.utilization)}`}
                style={{ width: `${Math.min(card.utilization, 100)}%` }}
              />
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatCurrency(card.balance)} of {formatCurrency(card.limit)}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
