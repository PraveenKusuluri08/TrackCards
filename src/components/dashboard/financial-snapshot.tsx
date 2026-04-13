import { formatCurrency, toNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardData = {
  id: string;
  currentBalance: unknown;
  creditLimit: unknown;
  [key: string]: unknown;
};

export function FinancialSnapshot({ cards }: { cards: CardData[] }) {
  const totalLimit = cards.reduce((s, c) => s + toNumber(c.creditLimit), 0);
  const totalBalance = cards.reduce((s, c) => s + toNumber(c.currentBalance), 0);
  const availableCredit = totalLimit - totalBalance;

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Financial Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Cards</p>
          <p className="text-lg font-semibold tabular-nums">{cards.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total Limit</p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalLimit)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total Balance</p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalBalance)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Available</p>
          <p className="text-lg font-semibold tabular-nums text-teal-600">{formatCurrency(availableCredit)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
