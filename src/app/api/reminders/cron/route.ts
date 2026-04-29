import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDueDateReminder } from "@/lib/email";
import { getDateInTimezone, addDaysToDate, datePartsEqual } from "@/lib/timezone";

function getTimeInTimezone(date: Date, timezone: string): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return { hour: get("hour"), minute: get("minute") };
}

function parseReminderTime(value: string | null | undefined): { hour: number; minute: number } {
  const v = (value || "09:00").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return { hour: 9, minute: 0 };
  const hour = Math.max(0, Math.min(23, parseInt(m[1]!, 10)));
  const minute = Math.max(0, Math.min(59, parseInt(m[2]!, 10)));
  return { hour, minute };
}

// Call this from a cron job (e.g. Vercel Cron) - runs daily to send reminders
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    let sent = 0;
    let inAppCreated = 0;
    let skippedByTime = 0;

    const cards = await prisma.creditCard.findMany({
      include: { user: true },
    });

    for (const card of cards) {
      const user = card.user;
      if (!user.email) continue;

      const tz = user.timezone || "America/New_York";
      const reminderDaysPref = (user.reminderDays || "7,3,1")
        .split(",")
        .map((d) => parseInt(d.trim(), 10))
        .filter((n) => !Number.isNaN(n) && [1, 3, 7].includes(n));

      const { hour: prefHour, minute: prefMinute } = parseReminderTime(user.reminderTime);
      const { hour: nowHour, minute: nowMinute } = getTimeInTimezone(now, tz);
      const nowMins = nowHour * 60 + nowMinute;
      const prefMins = prefHour * 60 + prefMinute;
      if (nowMins < prefMins) {
        skippedByTime++;
        continue;
      }

      const todayInTz = getDateInTimezone(now, tz);
      const cardDueParts = {
        year: card.dueDate.getFullYear(),
        month: card.dueDate.getMonth() + 1,
        day: card.dueDate.getDate(),
      };

      for (const daysBefore of reminderDaysPref) {
        if (![1, 3, 7].includes(daysBefore)) continue;

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

          // Also create an in-app notification (idempotent via unique constraint).
          try {
            await prisma.inAppNotification.create({
              data: {
                userId: user.id,
                cardId: card.id,
                type: "reminder",
                title: `${card.cardName} due in ${daysBefore} day${daysBefore === 1 ? "" : "s"}`,
                body: `Amount due: $${fullDue}`,
                eventDate: new Date(card.dueDate),
              },
              select: { id: true },
            });
            inAppCreated++;
          } catch {
            // duplicate
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} reminder emails`,
      cardsChecked: cards.length,
      inAppCreated,
      skippedByTime,
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
