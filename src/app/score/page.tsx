import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNumber, formatCurrency, getDaysUntilDue } from "@/lib/utils";
import { getUtilizationLevel } from "@/lib/dashboard-utils";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationBell } from "@/components/notification-bell";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default async function ScorePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/score");
  }

  const [cards, paymentHistory] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        cardName: true,
        currentBalance: true,
        creditLimit: true,
        fullDue: true,
        dueDate: true,
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.paymentHistory.findMany({
      where: { card: { userId: session.user.id } },
      select: { cardId: true, paidDate: true, amountPaid: true },
      orderBy: { paidDate: "desc" },
      take: 50,
    }),
  ]);

  const totalBalance = cards.reduce((s, c) => s + toNumber(c.currentBalance), 0);
  const totalLimit = cards.reduce((s, c) => s + toNumber(c.creditLimit), 0);
  const overallUtil = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  const utilLevel = getUtilizationLevel(overallUtil);

  const overdueCount = cards.filter((c) => getDaysUntilDue(c.dueDate) < 0).length;
  const dueSoonCount = cards.filter((c) => {
    const d = getDaysUntilDue(c.dueDate);
    return d >= 0 && d <= 7;
  }).length;

  const availableCredit = totalLimit - totalBalance;
  const availablePct = totalLimit > 0 ? (availableCredit / totalLimit) * 100 : 100;

  const utilScore = utilLevel === "healthy" ? 100 : utilLevel === "moderate" ? 70 : utilLevel === "high" ? 40 : 20;
  const onTimeScore = overdueCount > 0 ? 20 : dueSoonCount > 0 ? 70 : 100;
  const availableScore = availablePct >= 50 ? 100 : availablePct >= 30 ? 70 : availablePct >= 15 ? 40 : 20;

  const score = Math.round(utilScore * 0.4 + onTimeScore * 0.35 + availableScore * 0.25);

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const paidLast30 = paymentHistory
    .filter((p) => new Date(p.paidDate).getTime() >= last30Days.getTime())
    .reduce((s, p) => s + toNumber(p.amountPaid), 0);

  const utilizationAdvice =
    utilLevel === "healthy"
      ? "You’re in a healthy utilization range. Keep it under 30% when possible."
      : utilLevel === "moderate"
        ? "You’re in a moderate utilization range. Consider paying down balances to stay under 30%."
        : utilLevel === "high"
          ? "Utilization is high. Paying down balances can quickly improve your profile."
          : "Utilization is risky. Prioritize lowering balances and avoid new spend until you’re back under 50% (ideally 30%).";

  const paymentAdvice =
    overdueCount > 0
      ? "You have overdue payments. Getting current is the fastest way to reduce risk."
      : dueSoonCount > 0
        ? "You have due dates coming up soon. Set reminders and pay early to avoid surprises."
        : "No payments are currently overdue or due soon. Stay consistent.";

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <header className="sticky top-0 z-10 border-b border-amber-200/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-teal-600 hover:text-teal-700">
            PayTrack AI
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-600">Dashboard</Button>
            </Link>
            <Link href="/timeline">
              <Button variant="ghost" size="sm" className="text-slate-600">Timeline</Button>
            </Link>
            <Link href="/score">
              <Button variant="ghost" size="sm" className="text-slate-900">Score</Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-slate-600">Settings</Button>
            </Link>
            <NotificationBell />
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Credit Score Analyzer (v1)</h1>
          <p className="mt-1 text-slate-600">
            This is an explainable, behavior-based score (not a FICO score). It helps you understand what to fix next.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-amber-200/50 bg-white lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Your score</CardTitle>
              <p className="text-sm text-slate-500">0–100 health indicator</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={`flex items-center justify-between rounded-xl p-4 ${
                  score >= 70 ? "bg-emerald-50" : score >= 50 ? "bg-amber-50" : "bg-rose-50"
                }`}
              >
                <p className="text-sm font-medium text-slate-700">Score</p>
                <p className="text-3xl font-bold text-slate-900">{score}</p>
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                <p>
                  Utilization: <span className="font-medium">{overallUtil.toFixed(0)}%</span> ({utilLevel})
                </p>
                <p>
                  Available credit: <span className="font-medium">{clamp(availablePct, 0, 100).toFixed(0)}%</span>
                </p>
                <p>
                  Paid last 30 days: <span className="font-medium">{formatCurrency(paidLast30)}</span>
                </p>
              </div>
              {cards.length === 0 && (
                <p className="text-sm text-slate-500">Add a card to start generating a score and recommendations.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200/50 bg-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Breakdown (explainable)</CardTitle>
              <p className="text-sm text-slate-500">Weights: Utilization 40% · Payment timing 35% · Available credit 25%</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Utilization</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{utilScore}</p>
                  <p className="mt-1 text-sm text-slate-600">{utilizationAdvice}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Payment timing</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{onTimeScore}</p>
                  <p className="mt-1 text-sm text-slate-600">{paymentAdvice}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Available credit</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{availableScore}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Higher available credit generally reduces risk and improves flexibility.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                    View recommendations
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="border-amber-200 hover:bg-amber-50">
                    Tune reminders
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

