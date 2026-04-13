import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toNumber } from "@/lib/utils";
import { AddPaymentForm } from "@/components/cards/add-payment-form";
import { AddPendingPaymentForm } from "@/components/cards/add-pending-payment-form";
import { PendingPaymentsList } from "@/components/cards/pending-payments-list";
import { PaymentHistoryList } from "@/components/cards/payment-history-list";

export default async function PaymentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const card = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!card) {
    notFound();
  }

  const [paymentHistory, pendingPayments] = await Promise.all([
    prisma.paymentHistory.findMany({
      where: { cardId: id },
      orderBy: { paidDate: "desc" },
    }),
    prisma.pendingPayment
      .findMany({
        where: { cardId: id },
        orderBy: { paidDate: "desc" },
      })
      .catch(() => []),
  ]);

  const serializedPaymentHistory = paymentHistory.map((p) => ({
    id: p.id,
    amountPaid: toNumber(p.amountPaid),
    paidDate: p.paidDate.toISOString(),
    paymentType: p.paymentType,
    notes: p.notes,
  }));

  const serializedPendingPayments = pendingPayments.map((p) => ({
    id: p.id,
    amountPaid: toNumber(p.amountPaid),
    paidDate: p.paidDate.toISOString(),
    description: p.description,
    daysToPost: p.daysToPost,
    balanceUpdated: p.balanceUpdated,
  }));

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-bold text-teal-600">
            PayTrack AI
          </Link>
          <div className="flex gap-2">
            <Link href={`/cards/${id}`}>
              <Button variant="ghost" size="sm">Edit Card</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{card.cardName}</h1>
          <p className="text-slate-600">{card.issuerName}</p>
        </div>

        <AddPaymentForm
          cardId={id}
          minimumDue={toNumber(card.minimumDue)}
          fullDue={toNumber(card.fullDue)}
          currentBalance={toNumber(card.currentBalance)}
        />

        <div className="mt-8">
          <AddPendingPaymentForm
            cardId={id}
            currentBalance={toNumber(card.currentBalance)}
          />
        </div>

        {serializedPendingPayments.length > 0 && (
          <Card className="mt-8 border-amber-200/50 bg-amber-50/30">
            <CardHeader>
              <CardTitle>Pending (Not Yet Posted)</CardTitle>
              <p className="text-sm text-stone-600">
                Payments you made that haven&apos;t updated on your card yet.
              </p>
            </CardHeader>
            <CardContent>
              <PendingPaymentsList cardId={id} pending={serializedPendingPayments} />
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 border-amber-200/50 bg-white">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentHistoryList cardId={id} payments={serializedPaymentHistory} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
