import { formatCurrency, getDaysUntilDue, toNumber } from "@/lib/utils";

export type TimelineEvent =
  | {
      type: "due";
      date: Date;
      title: string;
      subtitle: string;
      href: string;
      severity: "high" | "medium" | "low";
    }
  | {
      type: "posting";
      date: Date;
      title: string;
      subtitle: string;
      href: string;
      severity: "low" | "medium";
    };

export function buildTimelineEvents(input: {
  cards: Array<{ id: string; cardName: string; dueDate: Date; fullDue: unknown }>;
  pending: Array<{ id: string; cardId: string; paidDate: Date; daysToPost: number; amountPaid: unknown; description: string | null; card: { cardName: string } }>;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const events: TimelineEvent[] = [];

  for (const card of input.cards) {
    const days = getDaysUntilDue(card.dueDate);
    const dueAmount = toNumber(card.fullDue);
    events.push({
      type: "due",
      date: new Date(card.dueDate),
      title: `${card.cardName} due`,
      subtitle:
        days < 0
          ? `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} · ${formatCurrency(dueAmount)}`
          : `Due in ${days} day${days === 1 ? "" : "s"} · ${formatCurrency(dueAmount)}`,
      href: `/cards/${card.id}/history`,
      severity: days < 0 ? "high" : days <= 3 ? "high" : days <= 7 ? "medium" : "low",
    });
  }

  for (const p of input.pending) {
    const posting = new Date(p.paidDate);
    posting.setDate(posting.getDate() + (p.daysToPost || 0));
    const days = getDaysUntilDue(posting);
    const amount = toNumber(p.amountPaid);
    events.push({
      type: "posting",
      date: posting,
      title: `${p.card.cardName} payment posting`,
      subtitle: `${formatCurrency(amount)}${p.description ? ` · ${p.description}` : ""}${
        days < 0 ? ` · posted ${Math.abs(days)}d ago` : ` · posts in ${days}d`
      }`,
      href: `/cards/${p.cardId}/history`,
      severity: days <= 1 ? "medium" : "low",
    });
  }

  return events
    .filter((e) => !Number.isNaN(e.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .filter((e) => e.date.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime());
}

