"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AddPendingPaymentForm({
  cardId,
  currentBalance,
}: {
  cardId: string;
  currentBalance: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(currentBalance);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/cards/${cardId}/pending-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: amount,
          paidDate: formData.get("paidDate"),
          description: (formData.get("description") as string)?.trim() || undefined,
          daysToPost: parseInt(formData.get("daysToPost") as string, 10) || 3,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to record pending payment");
        setLoading(false);
        return;
      }

      router.refresh();
      setAmount(currentBalance);
      (e.target as HTMLFormElement).reset();
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader>
        <CardTitle>Pending Payment (Not Yet Posted)</CardTitle>
        <p className="text-sm text-stone-600">
          Paid at a store, bank, or elsewhere but balance hasn&apos;t updated? Track it here. Cash and bank transfers typically take 2–5 business days.
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
            <div>
              <Label htmlFor="pendingAmount">Amount ($)</Label>
              <Input
                id="pendingAmount"
                name="amountPaid"
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="500.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="pendingPaidDate">Date Paid</Label>
              <Input
                id="pendingPaidDate"
                name="paidDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pendingDescription">Where / How (optional)</Label>
            <Input
              id="pendingDescription"
              name="description"
              placeholder="e.g. $500 cash at Walmart"
            />
          </div>
          <div>
            <Label htmlFor="daysToPost">Days until it usually posts</Label>
            <select
              id="daysToPost"
              name="daysToPost"
              defaultValue="3"
              className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <option value="1">1 day</option>
              <option value="2">2 days</option>
              <option value="3">3 days (typical for cash)</option>
              <option value="4">4 days</option>
              <option value="5">5 days</option>
              <option value="7">~1 week</option>
              <option value="10">~10 days</option>
              <option value="14">~2 weeks</option>
            </select>
            <p className="mt-1 text-xs text-stone-500">
              Cash and in-store payments usually show up in 2–5 business days.
            </p>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Pending Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
