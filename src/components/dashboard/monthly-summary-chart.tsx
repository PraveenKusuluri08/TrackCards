import { formatCurrency, toNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardData = {
  id: string;
  currentBalance: unknown;
  [key: string]: unknown;
};

type MonthData = {
  month: string;
  year: number;
  paymentsTotal: number;
  label: string;
};

type PaymentRecord = {
  cardId: string;
  paidDate: Date;
};

type MonthlySummaryChartProps = {
  cards: CardData[];
  paymentsByMonth: MonthData[];
  paymentHistory?: PaymentRecord[];
};

export function MonthlySummaryChart({ cards, paymentsByMonth, paymentHistory = [] }: MonthlySummaryChartProps) {
  const totalBalance = cards.reduce((sum, c) => sum + toNumber(c.currentBalance), 0);
  const maxPayment = Math.max(
    ...paymentsByMonth.map((m) => m.paymentsTotal),
    1
  );

  const now = new Date();
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const thisMonthPayments = paymentsByMonth.find((m) => m.month === monthNames[now.getMonth()] && m.year === now.getFullYear())?.paymentsTotal ?? 0;
  const cardsPaidThisMonth = new Set(paymentHistory.filter((p) => {
    const d = new Date(p.paidDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).map((p) => p.cardId)).size;

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Monthly Overview</CardTitle>
        <p className="text-sm text-slate-500">Payments & balance</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total payments this month</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{formatCurrency(thisMonthPayments)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Current balance</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Cards paid</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{cardsPaidThisMonth} / {cards.length || 1}</p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-slate-700">Payments by month</p>
          <div className="space-y-3">
            {paymentsByMonth.map((m) => (
              <div key={`${m.year}-${m.month}`} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-slate-500">{m.label}</span>
                <div className="flex-1">
                  <div className="h-6 w-full overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="h-full rounded-md bg-teal-500 transition-all"
                      style={{
                        width: `${(m.paymentsTotal / maxPayment) * 100}%`,
                        minWidth: m.paymentsTotal > 0 ? "4px" : "0",
                      }}
                    />
                  </div>
                </div>
                <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-slate-700">
                  {formatCurrency(m.paymentsTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {paymentsByMonth.length === 0 && (
          <p className="text-sm text-slate-500">No payments recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
