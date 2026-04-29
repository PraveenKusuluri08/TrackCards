import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDateInTimezone } from "@/lib/timezone";
import { toNumber } from "@/lib/utils";

function toUtcDateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Daily job that stores a balance snapshot per user (in the user's timezone).
 * Secured by CRON_SECRET, similar to reminders cron.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        timezone: true,
        creditCards: { select: { id: true, currentBalance: true, creditLimit: true } },
      },
    });

    let created = 0;
    let updated = 0;

    for (const user of users) {
      const tz = user.timezone || "America/New_York";
      const today = getDateInTimezone(now, tz);
      const snapshotDate = toUtcDateOnly(today.year, today.month, today.day);

      const totalBalance = user.creditCards.reduce((s, c) => s + toNumber(c.currentBalance), 0);
      const cardBalances = user.creditCards.map((c) => {
        const balance = toNumber(c.currentBalance);
        const limit = toNumber(c.creditLimit);
        const utilizationPct = limit > 0 ? (balance / limit) * 100 : 0;
        return { cardId: c.id, balance, limit, utilizationPct };
      });

      try {
        await prisma.balanceSnapshot.create({
          data: {
            userId: user.id,
            snapshotDate,
            totalBalance,
            cardBalances,
          },
          select: { id: true },
        });
        created++;
      } catch (e) {
        // Unique constraint race / re-run: update instead (idempotent).
        await prisma.balanceSnapshot.update({
          where: { userId_snapshotDate: { userId: user.id, snapshotDate } },
          data: { totalBalance, cardBalances },
          select: { id: true },
        });
        updated++;
      }
    }

    return NextResponse.json({ success: true, created, updated, usersChecked: users.length });
  } catch (error) {
    console.error("Balance snapshot cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

