import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysUntilDue, toNumber, serializeCard, type SerializedCard } from "@/lib/utils";
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
import { BalanceOverTimeChart } from "@/components/dashboard/balance-over-time-chart";
import { getDateInTimezone } from "@/lib/timezone";
import { PaymentRecommendations } from "@/components/dashboard/payment-recommendations";
import { UpcomingTimeline } from "@/components/dashboard/upcoming-timeline";
import { buildTimelineEvents } from "@/lib/timeline";
import { AppHeader } from "@/components/app-header";

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

  const hasCards = cards.length > 0;

  // Ensure we have a snapshot for "today" in user's timezone (best-effort, idempotent).
  // If the DB hasn't been updated yet (table missing), we skip without crashing the dashboard.
  let snapshots: Array<{ snapshotDate: Date; totalBalance: unknown }> = [];
  try {
    const tz = (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    }))?.timezone || "America/New_York";
    const today = getDateInTimezone(new Date(), tz);
    const snapshotDate = new Date(Date.UTC(today.year, today.month - 1, today.day));
    const existingToday = await prisma.balanceSnapshot.findUnique({
      where: { userId_snapshotDate: { userId: session.user.id, snapshotDate } },
      select: { id: true },
    });
    if (!existingToday) {
      const totalBalance = cards.reduce((s, c) => s + toNumber(c.currentBalance), 0);
      const cardBalances = cards.map((c) => {
        const balance = toNumber(c.currentBalance);
        const limit = toNumber(c.creditLimit);
        const utilizationPct = limit > 0 ? (balance / limit) * 100 : 0;
        return { cardId: c.id, balance, limit, utilizationPct };
      });
      try {
        await prisma.balanceSnapshot.create({
          data: { userId: session.user.id, snapshotDate, totalBalance, cardBalances },
        });
      } catch (e) {
        // Another request likely created it first; ignore to keep dashboard fast.
      }
    }

    snapshots = await prisma.balanceSnapshot.findMany({
      where: { userId: session.user.id },
      orderBy: { snapshotDate: "asc" },
      take: 90,
      select: { snapshotDate: true, totalBalance: true },
    });
  } catch (error) {
    console.warn("Balance snapshots not available yet:", error);
  }

  const pending = await prisma.pendingPayment.findMany({
    where: { card: { userId: session.user.id } },
    select: {
      id: true,
      cardId: true,
      paidDate: true,
      daysToPost: true,
      amountPaid: true,
      description: true,
      card: { select: { cardName: true } },
    },
    orderBy: { paidDate: "desc" },
    take: 20,
  });

  const timelineEvents = buildTimelineEvents({
    cards: rawCards.map((c) => ({ id: c.id, cardName: c.cardName, dueDate: c.dueDate, fullDue: c.fullDue })),
    pending,
  });

  // Best-effort: generate in-app notifications (idempotent via unique constraint).
  const todayUtc = new Date();
  const todayDateOnly = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate()));
  const notificationsToCreate: Array<{
    userId: string;
    cardId: string | null;
    type: string;
    title: string;
    body: string | null;
    eventDate: Date;
  }> = [];

  for (const c of cards) {
    const days = getDaysUntilDue(c.dueDate);
    const util = c.creditLimit > 0 ? (c.currentBalance / c.creditLimit) * 100 : 0;

    if (days < 0) {
      notificationsToCreate.push({
        userId: session.user.id,
        cardId: c.id,
        type: "overdue",
        title: `${c.cardName} is overdue`,
        body: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}.`,
        eventDate: new Date(c.dueDate),
      });
    } else if (days <= 3) {
      notificationsToCreate.push({
        userId: session.user.id,
        cardId: c.id,
        type: "due_soon",
        title: `${c.cardName} due soon`,
        body: `Due in ${days} day${days === 1 ? "" : "s"}.`,
        eventDate: new Date(c.dueDate),
      });
    }

    // Utilization threshold notifications (30/50/75). One per day per card at the highest threshold crossed.
    if (util >= 75) {
      notificationsToCreate.push({
        userId: session.user.id,
        cardId: c.id,
        type: "util_75",
        title: `${c.cardName} utilization above 75%`,
        body: `Currently at ${util.toFixed(0)}%.`,
        eventDate: todayDateOnly,
      });
    } else if (util >= 50) {
      notificationsToCreate.push({
        userId: session.user.id,
        cardId: c.id,
        type: "util_50",
        title: `${c.cardName} utilization above 50%`,
        body: `Currently at ${util.toFixed(0)}%.`,
        eventDate: todayDateOnly,
      });
    } else if (util >= 30) {
      notificationsToCreate.push({
        userId: session.user.id,
        cardId: c.id,
        type: "util_30",
        title: `${c.cardName} utilization above 30%`,
        body: `Currently at ${util.toFixed(0)}%.`,
        eventDate: todayDateOnly,
      });
    }
  }

  for (const e of timelineEvents) {
    if (e.type !== "posting") continue;
    const days = getDaysUntilDue(e.date);
    if (days > 1) continue;
    const cardId = e.href.startsWith("/cards/") ? e.href.split("/")[2] ?? null : null;
    notificationsToCreate.push({
      userId: session.user.id,
      cardId,
      type: "posting",
      title: "Payment posting soon",
      body: e.title,
      eventDate: new Date(e.date),
    });
  }

  if (notificationsToCreate.length > 0) {
    try {
      await prisma.inAppNotification.createMany({
        data: notificationsToCreate.map((n) => ({
          userId: n.userId,
          cardId: n.cardId,
          type: n.type,
          title: n.title,
          body: n.body,
          eventDate: n.eventDate,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.warn("In-app notifications not available yet:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <AppHeader />

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
          {!hasCards && (
            <div className="rounded-xl border border-amber-200/60 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Get started in 2 minutes</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add your first card and PayTrack AI will surface upcoming due dates, utilization, and next best actions.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/cards/add">
                  <Button size="sm">Add your first card</Button>
                </Link>
                <Link href="/timeline">
                  <Button size="sm" variant="outline" className="border-amber-200 hover:bg-amber-50">
                    View timeline
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="border-amber-200 hover:bg-amber-50">
                    Set reminders
                  </Button>
                </Link>
              </div>
            </div>
          )}

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

          <UpcomingTimeline events={timelineEvents} />

          <PaymentRecommendations cards={cards} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RecommendedActions cards={cards} />
            <RiskAlerts cards={cards} />
          </div>

          <FinancialSnapshot cards={cards} />

          <BalanceOverTimeChart snapshots={snapshots} />

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
