import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toNumber } from "@/lib/utils";

type Snapshot = {
  snapshotDate: Date;
  totalBalance: unknown;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildSparklinePoints(values: number[], width: number, height: number, padding: number) {
  if (values.length === 0) return "";

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = Math.max(maxV - minV, 1);

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  return values
    .map((v, i) => {
      const x = padding + (innerW * i) / Math.max(values.length - 1, 1);
      const y = padding + innerH - ((v - minV) / span) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function BalanceOverTimeChart({
  snapshots,
  title = "Balance over time",
}: {
  snapshots: Snapshot[];
  title?: string;
}) {
  const data = snapshots
    .slice()
    .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());

  const values = data.map((s) => toNumber(s.totalBalance));
  const current = values.at(-1) ?? 0;
  const previous = values.length > 1 ? values.at(-2) ?? current : current;
  const delta = current - previous;
  const deltaPct = previous > 0 ? (delta / previous) * 100 : 0;

  const w = 520;
  const h = 140;
  const padding = 12;
  const points = buildSparklinePoints(values, w, h, padding);

  const trendColor = delta <= 0 ? "stroke-teal-600" : "stroke-rose-600";
  const trendBg = delta <= 0 ? "bg-teal-50 text-teal-800" : "bg-rose-50 text-rose-800";

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-slate-500">See progress as your balances change</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Current total balance</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(current)}</p>
          </div>
          <div className={`rounded-lg px-3 py-2 text-sm font-medium tabular-nums ${trendBg}`}>
            {delta === 0 ? (
              <span>No change</span>
            ) : (
              <span>
                {delta < 0 ? "↓" : "↑"} {formatCurrency(Math.abs(delta))}{" "}
                <span className="text-xs opacity-80">({clamp(Math.abs(deltaPct), 0, 999).toFixed(1)}%)</span>
              </span>
            )}
          </div>
        </div>

        {values.length < 2 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Not enough history yet. Your balance trend will appear after a couple of daily snapshots.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-[140px] w-full">
              <polyline points={points} fill="none" className={`${trendColor}`} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

