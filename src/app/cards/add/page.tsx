"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CARD_ISSUERS, detectCardIssuer } from "@/lib/card-issuers";

export default function AddCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardName, setCardName] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [detectedIssuer, setDetectedIssuer] = useState<string | null>(null);
  const issuerTouchedByUser = useRef(false);

  // Auto-fill issuer from card name only when user hasn't edited it
  useEffect(() => {
    const fromCard = detectCardIssuer(cardName);
    const fromIssuer = detectCardIssuer(issuerName);
    setDetectedIssuer(fromCard || fromIssuer);
    if (fromCard && !issuerTouchedByUser.current) {
      setIssuerName(fromCard);
    }
  }, [cardName, issuerName]);

  function handleIssuerChange(e: React.ChangeEvent<HTMLInputElement>) {
    issuerTouchedByUser.current = true;
    setIssuerName(e.target.value);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
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
        setError(data.error || "Failed to add card");
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

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <header className="border-b border-amber-200/60 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="text-lg font-bold text-teal-600">
            PayTrack AI
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        <Card className="border-amber-200/50 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Add Credit Card</CardTitle>
            <p className="text-sm text-stone-600">
              Enter your card details. We never store full card numbers.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cardName">Card Name</Label>
                  <Input
                    id="cardName"
                    name="cardName"
                    placeholder="e.g. Chase Sapphire, Discover it"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuerName">Bank / Issuer</Label>
                  <Input
                    id="issuerName"
                    name="issuerName"
                    placeholder="e.g. Chase, Amex, Discover"
                    value={issuerName}
                    onChange={handleIssuerChange}
                    list="issuer-suggestions"
                    required
                  />
                  <datalist id="issuer-suggestions">
                    {CARD_ISSUERS.map((issuer) => (
                      <option key={issuer} value={issuer} />
                    ))}
                  </datalist>
                  {detectedIssuer && (
                    <p className="mt-1 text-xs text-teal-600">
                      Detected: {detectedIssuer}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="lastFourDigits">Last 4 Digits (optional)</Label>
                <Input
                  id="lastFourDigits"
                  name="lastFourDigits"
                  placeholder="1234"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  className="mt-1.5"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                  <Input
                    id="creditLimit"
                    name="creditLimit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="10000"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currentBalance">Current Balance ($)</Label>
                  <Input
                    id="currentBalance"
                    name="currentBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2500"
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="minimumDue">Minimum Due ($)</Label>
                  <Input
                    id="minimumDue"
                    name="minimumDue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="75"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fullDue">Full Payment Due ($)</Label>
                  <Input
                    id="fullDue"
                    name="fullDue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2500"
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="statementDate">Statement Date</Label>
                  <Input
                    id="statementDate"
                    name="statementDate"
                    type="date"
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Card"}
                </Button>
                <Link href="/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
