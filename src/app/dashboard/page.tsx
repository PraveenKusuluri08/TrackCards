import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNumber, serializeCard, type SerializedCard } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CardsList } from "@/components/dashboard/cards-list";
import { ActionRequiredBanner } from "@/components/dashboard/action-required-banner";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { NextPaymentsTable } from "@/components/dashboard/next-payments-table";
import { CreditUtilizationWidget } from "@/components/dashboard/credit-utilization-widget";
import { CreditHealthScore } from "@/components/dashboard/credit-health-score";
import { RecommendedActions } from "@/components/dashboard/recommended-actions";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RiskAlerts } from "@/components/dashboard/risk-alerts";
import { FinancialSnapshot } from "@/components/dashboard/financial-snapshot";
import { MonthlySummaryChart } from "@/components/dashboard/monthly-summary-chart";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const [rawCards, paymentHistory] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId: session.user.id },
      orderBy: { dueDate: "asc" },
    }),
    prisma.paymentHistory.findMany({
      where: { card: { userId: session.user.id } },
      select: { cardId: true, paidDate: true, amountPaid: true },
    }),
  ]);

  // Aggregate payments by month (last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const monthsData: { month: number; year: number; paymentsTotal: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsData.push({
      month: d.getMonth(),
      year: d.getFullYear(),
      paymentsTotal: 0,
    });
  }
  for (const p of paymentHistory) {
    const paid = new Date(p.paidDate);
    const amt = toNumber(p.amountPaid);
    const m = monthsData.find((x) => x.month === paid.getMonth() && x.year === paid.getFullYear());
    if (m) m.paymentsTotal += amt;
  }
  const paymentsByMonth = monthsData.map((m) => ({
    month: monthNames[m.month],
    year: m.year,
    paymentsTotal: m.paymentsTotal,
    label: `${monthNames[m.month].slice(0, 3)} ${String(m.year).slice(2)}`,
  }));

  const cards: SerializedCard[] = rawCards.map((c) => serializeCard({ ...c }));

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
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-slate-600">Settings</Button>
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-1 text-slate-600">
            Here&apos;s your credit card overview.
          </p>
        </div>

        <div className="space-y-8">
          <ActionRequiredBanner cards={cards} />
          <InsightBanner cards={cards} />

          <SummaryCards cards={cards} />

          <NextPaymentsTable cards={cards} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <QuickActions firstCardId={cards[0]?.id} hasCards={cards.length > 0} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CreditUtilizationWidget cards={cards} />
            <CreditHealthScore cards={cards} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RecommendedActions cards={cards} />
            <RiskAlerts cards={cards} />
          </div>

          <FinancialSnapshot cards={cards} />

          <MonthlySummaryChart
            cards={cards}
            paymentsByMonth={paymentsByMonth}
            paymentHistory={paymentHistory.map((p) => ({ cardId: p.cardId, paidDate: p.paidDate }))}
          />

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your Cards</h2>
              <Link href="/cards/add">
                <Button size="sm">Add Card</Button>
              </Link>
            </div>
            <CardsList cards={cards} />
          </div>
        </div>
      </main>
    </div>
  );
}
