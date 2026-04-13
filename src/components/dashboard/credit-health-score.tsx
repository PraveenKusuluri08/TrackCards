import { toNumber } from "@/lib/utils";
import { getUtilizationLevel } from "@/lib/dashboard-utils";
import { getDaysUntilDue } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardData = {
  id: string;
  currentBalance: unknown;
  creditLimit: unknown;
  fullDue: unknown;
  dueDate: Date | string;
};

export function CreditHealthScore({ cards }: { cards: CardData[] }) {
  const totalBalance = cards.reduce((s, c) => s + toNumber(c.currentBalance), 0);
  const totalLimit = cards.reduce((s, c) => s + toNumber(c.creditLimit), 0);
  const overallUtil = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  const availableCredit = totalLimit - totalBalance;
  const availablePct = totalLimit > 0 ? (availableCredit / totalLimit) * 100 : 100;

  const utilLevel = getUtilizationLevel(overallUtil);
  const overdueCount = cards.filter((c) => getDaysUntilDue(c.dueDate) < 0).length;
  const dueSoonCount = cards.filter((c) => {
    const d = getDaysUntilDue(c.dueDate);
    return d >= 0 && d <= 7;
  }).length;

  const onTimeScore = overdueCount > 0 ? 20 : dueSoonCount > 0 ? 70 : 100;
  const utilScore =
    utilLevel === "healthy" ? 100 : utilLevel === "moderate" ? 70 : utilLevel === "high" ? 40 : 20;
  const availableScore = availablePct >= 50 ? 100 : availablePct >= 30 ? 70 : availablePct >= 15 ? 40 : 20;

  const score = Math.round((utilScore * 0.4 + onTimeScore * 0.35 + availableScore * 0.25));

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Credit Health Score</CardTitle>
        <p className="text-sm text-slate-500">Overall financial health</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${
              score >= 70 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            }`}
          >
            {score}
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{score} / 100</p>
            <p className="text-sm text-slate-500">
              {score >= 70 ? "Good" : score >= 50 ? "Needs attention" : "At risk"}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Utilization</span>
            <span className={utilLevel === "healthy" ? "text-emerald-600" : utilLevel === "moderate" ? "text-amber-600" : "text-red-600"}>
              {utilLevel === "healthy" ? "Good ✓" : utilLevel === "moderate" ? "Moderate" : "High ⚠"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>On-time payments</span>
            <span className={onTimeScore >= 70 ? "text-emerald-600" : "text-amber-600"}>
              {onTimeScore >= 70 ? "Good ✓" : "Needs attention"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Available credit</span>
            <span className={availableScore >= 70 ? "text-emerald-600" : availableScore >= 40 ? "text-amber-600" : "text-red-600"}>
              {availableScore >= 70 ? "Good ✓" : availableScore >= 40 ? "Medium" : "Low"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
