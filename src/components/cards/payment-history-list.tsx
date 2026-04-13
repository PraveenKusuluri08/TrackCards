"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Payment = {
  id: string;
  amountPaid: number;
  paidDate: string;
  paymentType: string;
  notes: string | null;
};

export function PaymentHistoryList({
  cardId,
  payments,
}: {
  cardId: string;
  payments: Payment[];
}) {
  const router = useRouter();

  async function handleDelete(paymentId: string) {
    try {
      await fetch(`/api/cards/${cardId}/payments/${paymentId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch {
      // Ignore
    }
  }

  if (payments.length === 0) {
    return <p className="text-slate-500">No payments recorded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0"
        >
          <div>
            <p className="font-medium">
              {formatCurrency(payment.amountPaid)}
            </p>
            <p className="text-sm text-slate-500">
              {new Date(payment.paidDate).toLocaleDateString()} •{" "}
              {payment.paymentType}
            </p>
            {payment.notes && (
              <p className="mt-1 text-sm text-slate-600">{payment.notes}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-stone-500 hover:text-red-600 shrink-0"
            onClick={() => handleDelete(payment.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
