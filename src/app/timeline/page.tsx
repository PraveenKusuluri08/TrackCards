import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTimelineEvents } from "@/lib/timeline";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationBell } from "@/components/notification-bell";

export default async function TimelinePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/timeline");
  }

  const [cards, pending] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId: session.user.id },
      select: { id: true, cardName: true, dueDate: true, fullDue: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.pendingPayment.findMany({
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
      take: 50,
    }),
  ]);

  const events = buildTimelineEvents({ cards, pending });

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
              <Button variant="ghost" size="sm" className="text-slate-900">Timeline</Button>
            </Link>
            <Link href="/score">
              <Button variant="ghost" size="sm" className="text-slate-600">Score</Button>
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
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Timeline</h1>
            <p className="mt-1 text-slate-600">Upcoming due dates and posting activity</p>
          </div>
          <Link href="/cards/add">
            <Button size="sm">Add Card</Button>
          </Link>
        </div>

        <Card className="border-amber-200/50 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-slate-500">No events yet. Add a card to get started.</p>
            ) : (
              <ol className="space-y-3">
                {events.map((e, idx) => (
                  <li key={`${e.type}-${e.href}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{e.title}</p>
                      <p className="text-sm tabular-nums text-slate-500">
                        {e.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{e.subtitle}</p>
                    <div className="mt-2">
                      <Link href={e.href}>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-teal-600 hover:bg-transparent">
                          View →
                        </Button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

