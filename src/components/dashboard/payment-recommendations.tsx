"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getDaysUntilDue } from "@/lib/utils";
import type { SerializedCard } from "@/lib/utils";

type Ranked = {
  card: SerializedCard;
  score: number;
  utilNow: number;
  utilAfter: number;
  appliedPayment: number;
  daysUntilDue: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function utilization(balance: number, limit: number) {
  if (limit <= 0) return 0;
  return (balance / limit) * 100;
}

function scoreCard(card: SerializedCard) {
  const days = getDaysUntilDue(card.dueDate);
  const util = utilization(card.currentBalance, card.creditLimit);
  const bal = card.currentBalance;

  const dueScore =
    days < 0 ? 120 + clamp(Math.abs(days), 0, 30) : days <= 7 ? 100 - days * 10 : clamp(60 - days, 0, 60);
  const utilScore = clamp(util, 0, 100);
  const balScore = clamp(bal / 100, 0, 100); // light weight, prevents huge balances dominating

  return dueScore * 0.5 + utilScore * 0.4 + balScore * 0.1;
}

export function PaymentRecommendations({ cards }: { cards: SerializedCard[] }) {
  const [amount, setAmount] = useState<number>(500);

  const ranked = useMemo<Ranked[]>(() => {
    const amt = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    return cards
      .map((card) => {
        const utilNow = utilization(card.currentBalance, card.creditLimit);
        const appliedPayment = Math.min(card.currentBalance, amt);
        const utilAfter = utilization(Math.max(0, card.currentBalance - appliedPayment), card.creditLimit);
        return {
          card,
          score: scoreCard(card),
          utilNow,
          utilAfter,
          appliedPayment,
          daysUntilDue: getDaysUntilDue(card.dueDate),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [cards, amount]);

  if (cards.length === 0) return null;

  return (
    <Card className="border-amber-200/50 bg-white">
      <CardHeader>
        <CardTitle className="text-base">What should I pay first?</CardTitle>
        <p className="text-sm text-slate-500">Ranked by urgency + utilization impact</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Payment amount for preview
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">$</span>
            <input
              value={String(amount)}
              onChange={(e) => setAmount(Number(e.target.value))}
              inputMode="decimal"
              className="w-28 rounded-md border border-slate-200 px-3 py-2 text-sm tabular-nums outline-none focus:border-teal-400"
              aria-label="Payment amount"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-200 hover:bg-amber-50"
              onClick={() => setAmount(500)}
            >
              Reset
            </Button>
          </div>
        </div>

        <ul className="space-y-2">
          {ranked.map((r) => (
            <li key={r.card.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{r.card.cardName}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {r.daysUntilDue < 0
                      ? `Overdue by ${Math.abs(r.daysUntilDue)} day${Math.abs(r.daysUntilDue) === 1 ? "" : "s"}`
                      : `Due in ${r.daysUntilDue} day${r.daysUntilDue === 1 ? "" : "s"}`}
                    {" · "}
                    Balance {formatCurrency(r.card.currentBalance)}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Paying <span className="font-medium">{formatCurrency(r.appliedPayment)}</span> reduces utilization{" "}
                    <span className="font-medium">{r.utilNow.toFixed(0)}%</span> →{" "}
                    <span className="font-medium">{r.utilAfter.toFixed(0)}%</span>
                  </p>
                </div>
                <Link href={`/cards/${r.card.id}/history`} className="shrink-0">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                    Record payment
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

