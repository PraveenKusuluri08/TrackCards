"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AddPaymentFormProps = {
  cardId: string;
  minimumDue: number;
  fullDue: number;
  currentBalance: number;
};

export function AddPaymentForm({ cardId, minimumDue, fullDue }: AddPaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "minimum" | "partial">("full");
  const [amount, setAmount] = useState(fullDue);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (paymentType === "full") setAmount(fullDue);
    else if (paymentType === "minimum") setAmount(minimumDue);
    else setAmount(minimumDue);
  }, [paymentType, fullDue, minimumDue]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/cards/${cardId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: amount,
          paidDate: formData.get("paidDate"),
          paymentType: paymentType,
          notes: formData.get("notes") || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to record payment");
        setLoading(false);
        return;
      }

      router.refresh();
      setAmount(fullDue);
      setPaymentType("full");
      (e.target as HTMLFormElement).reset();
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
        <p className="text-sm text-slate-600">
          Add a payment you&apos;ve made to track your history.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount ($)</Label>
              <Input
                id="amountPaid"
                name="amountPaid"
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidDate">Date</Label>
              <Input
                id="paidDate"
                name="paidDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type</Label>
            <select
              id="paymentType"
              name="paymentType"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as "full" | "minimum" | "partial")}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              required
            >
              <option value="full">Full payment</option>
              <option value="minimum">Minimum payment</option>
              <option value="partial">Partial payment</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" name="notes" placeholder="e.g. Auto-pay" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
