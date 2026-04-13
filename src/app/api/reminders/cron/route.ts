import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDueDateReminder } from "@/lib/email";
import { getDateInTimezone, addDaysToDate, datePartsEqual } from "@/lib/timezone";

const REMINDER_DAYS = [7, 3, 1] as const;

// Call this from a cron job (e.g. Vercel Cron) - runs daily to send reminders
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    let sent = 0;

    const cards = await prisma.creditCard.findMany({
      include: { user: true },
    });

    for (const card of cards) {
      const user = card.user;
      if (!user.email) continue;

      const tz = user.timezone || "America/New_York";
      const reminderDaysPref = (user.reminderDays || "7,3,1").split(",").map((d) => parseInt(d.trim(), 10));

      const todayInTz = getDateInTimezone(now, tz);
      const cardDueParts = {
        year: card.dueDate.getFullYear(),
        month: card.dueDate.getMonth() + 1,
        day: card.dueDate.getDate(),
      };

      for (const daysBefore of REMINDER_DAYS) {
        if (!reminderDaysPref.includes(daysBefore)) continue;

        const targetDate = addDaysToDate(
          todayInTz.year,
          todayInTz.month,
          todayInTz.day,
          daysBefore
        );
        if (!datePartsEqual(targetDate, cardDueParts)) continue;

        const existing = await prisma.notification.findUnique({
          where: {
            cardId_dueDate_reminderDays: {
              cardId: card.id,
              dueDate: card.dueDate,
              reminderDays: daysBefore,
            },
          },
        });
        if (existing?.sentStatus) continue;

        const fullDue = typeof card.fullDue === "object" ? (card.fullDue as { toString(): string }).toString() : String(card.fullDue);
        const result = await sendDueDateReminder(
          user.email,
          user.name || "there",
          card.cardName,
          card.dueDate,
          fullDue,
          daysBefore
        );

        if (result.success) {
          await prisma.notification.upsert({
            where: {
              cardId_dueDate_reminderDays: {
                cardId: card.id,
                dueDate: card.dueDate,
                reminderDays: daysBefore,
              },
            },
            create: {
              userId: user.id,
              cardId: card.id,
              dueDate: card.dueDate,
              reminderDays: daysBefore,
              sentStatus: true,
              sentAt: new Date(),
            },
            update: {
              sentStatus: true,
              sentAt: new Date(),
            },
          });
          sent++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} reminder emails`,
      cardsChecked: cards.length,
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
