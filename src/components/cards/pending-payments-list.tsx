"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PendingPayment = {
  id: string;
  amountPaid: number;
  paidDate: string;
  description: string | null;
  daysToPost: number;
  balanceUpdated?: boolean;
};

export function PendingPaymentsList({
  cardId,
  pending,
}: {
  cardId: string;
  pending: PendingPayment[];
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/cards/${cardId}/pending-payments/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch {
      // Ignore
    }
  }

  async function handleMarkPosted(id: string) {
    try {
      const res = await fetch(`/api/cards/${cardId}/pending-payments/${id}/mark-posted`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } catch {
      // Ignore
    }
  }

  async function handleBalanceUpdated(id: string) {
    try {
      const res = await fetch(`/api/cards/${cardId}/pending-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balanceUpdated: true }),
      });
      if (res.ok) router.refresh();
    } catch {
      // Ignore
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      {pending.map((p) => {
        const paid = new Date(p.paidDate);
        paid.setHours(0, 0, 0, 0);
        const expectedPost = new Date(paid);
        expectedPost.setDate(expectedPost.getDate() + p.daysToPost);
        const daysLeft = Math.ceil((expectedPost.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <div
            key={p.id}
            className="flex flex-col gap-3 rounded-lg border border-amber-200/60 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">
                {formatCurrency(p.amountPaid)}
              </p>
              <p className="text-sm text-stone-500">
                Paid {new Date(p.paidDate).toLocaleDateString()}
                {p.description && ` • ${p.description}`}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {daysLeft <= 0
                  ? "Should have posted by now"
                  : daysLeft === 1
                    ? "Expected to post tomorrow"
                    : `Expected to post in ${daysLeft} days`}
              </p>
              {p.balanceUpdated && (
                <p className="mt-1 text-xs font-medium text-emerald-600">
                  ✓ Balance updated
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleMarkPosted(p.id)}
              >
                Mark Posted
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={p.balanceUpdated}
                className={
                  p.balanceUpdated
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200"
                }
                onClick={() => handleBalanceUpdated(p.id)}
              >
                {p.balanceUpdated ? "Balance Updated ✓" : "Balance Changed"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-stone-500 hover:text-red-600"
                onClick={() => handleDelete(p.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
