import { formatCurrency, getDaysUntilDue, toNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardData = {
  id: string;
  currentBalance: unknown;
  creditLimit: unknown;
  fullDue: unknown;
  minimumDue?: unknown;
  dueDate: Date | string;
};

export function SummaryCards({ cards }: { cards: CardData[] }) {
  const totalBalance = cards.reduce((sum, c) => sum + toNumber(c.currentBalance), 0);

  const totalLimit = cards.reduce((sum, c) => sum + toNumber(c.creditLimit), 0);

  const totalDueThisMonth = cards.reduce((sum, c) => {
    const days = getDaysUntilDue(c.dueDate);
    if (days >= 0 && days <= 31) return sum + toNumber(c.fullDue);
    return sum;
  }, 0);

  const availableCredit = totalLimit - totalBalance;
  const utilizationPercent = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-amber-200/50 bg-white shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-1 pt-6">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(totalBalance)}
          </p>
        </CardContent>
      </Card>
      <Card className="border-amber-200/50 bg-white shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-1 pt-6">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Due This Month
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(totalDueThisMonth)}
          </p>
        </CardContent>
      </Card>
      <Card className="border-amber-200/50 bg-white shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-1 pt-6">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Available Credit
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <p className="text-2xl font-bold tabular-nums text-teal-600">
            {formatCurrency(availableCredit)}
          </p>
        </CardContent>
      </Card>
      <Card className="border-amber-200/50 bg-white shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-1 pt-6">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            {utilizationPercent.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
