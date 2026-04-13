"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PrismaCard = {
  id: string;
  cardName: string;
  issuerName: string;
  lastFourDigits: string | null;
  creditLimit: number | { toString: () => string };
  currentBalance: number | { toString: () => string };
  minimumDue: number | { toString: () => string };
  fullDue: number | { toString: () => string };
  dueDate: Date | string;
  statementDate: Date | string;
};

function toStr(val: { toString: () => string } | number): string {
  return typeof val === "object" ? val.toString() : String(val);
}

function formatDateForInput(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0];
}

export function EditCardForm({ card }: { card: PrismaCard }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName: formData.get("cardName"),
          issuerName: formData.get("issuerName"),
          lastFourDigits: formData.get("lastFourDigits") || undefined,
          creditLimit: parseFloat(formData.get("creditLimit") as string),
          currentBalance: parseFloat(formData.get("currentBalance") as string),
          minimumDue: parseFloat(formData.get("minimumDue") as string),
          fullDue: parseFloat(formData.get("fullDue") as string),
          dueDate: formData.get("dueDate"),
          statementDate: formData.get("statementDate"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update card");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Failed to delete card");
      }
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
    setDeleteConfirm(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Card</CardTitle>
        <p className="text-sm text-slate-600">{card.cardName}</p>
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
              <Label htmlFor="cardName">Card Name</Label>
              <Input
                id="cardName"
                name="cardName"
                defaultValue={card.cardName}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuerName">Bank / Issuer</Label>
              <Input
                id="issuerName"
                name="issuerName"
                defaultValue={card.issuerName}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastFourDigits">Last 4 Digits (optional)</Label>
            <Input
              id="lastFourDigits"
              name="lastFourDigits"
              defaultValue={card.lastFourDigits || ""}
              maxLength={4}
              pattern="[0-9]{4}"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit ($)</Label>
              <Input
                id="creditLimit"
                name="creditLimit"
                type="number"
                step="0.01"
                min="0"
                defaultValue={toStr(card.creditLimit)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentBalance">Current Balance ($)</Label>
              <Input
                id="currentBalance"
                name="currentBalance"
                type="number"
                step="0.01"
                min="0"
                defaultValue={toStr(card.currentBalance)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minimumDue">Minimum Due ($)</Label>
              <Input
                id="minimumDue"
                name="minimumDue"
                type="number"
                step="0.01"
                min="0"
                defaultValue={toStr(card.minimumDue)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullDue">Full Payment Due ($)</Label>
              <Input
                id="fullDue"
                name="fullDue"
                type="number"
                step="0.01"
                min="0"
                defaultValue={toStr(card.fullDue)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                min={today}
                defaultValue={formatDateForInput(card.dueDate)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statementDate">Statement Date</Label>
              <Input
                id="statementDate"
                name="statementDate"
                type="date"
                defaultValue={formatDateForInput(card.statementDate)}
                required
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Link href="/dashboard">
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {deleteConfirm ? "Click again to confirm delete" : "Delete Card"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
