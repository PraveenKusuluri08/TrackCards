import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      timezone: true,
      reminderDays: true,
      reminderTime: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    emailVerified: !!user.emailVerified,
    timezone: user.timezone || "America/New_York",
    reminderDays: user.reminderDays || "7,3,1",
    reminderTime: user.reminderTime || "09:00",
  });
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  timezone: z.string().max(64).optional(),
  reminderDays: z.string().max(32).optional(),
  reminderTime: z.string().max(8).optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.timezone !== undefined) updates.timezone = parsed.data.timezone;
    if (parsed.data.reminderDays !== undefined) {
      const days = parsed.data.reminderDays.split(",").map((d) => parseInt(d.trim(), 10)).filter((n) => !isNaN(n) && [1, 3, 7].includes(n));
      updates.reminderDays = days.length > 0 ? days.sort((a, b) => b - a).join(",") : "7,3,1";
    }
    if (parsed.data.reminderTime !== undefined) updates.reminderTime = parsed.data.reminderTime;

    if (parsed.data.email !== undefined && parsed.data.email !== session.user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
      updates.email = parsed.data.email;
      updates.emailVerified = null; // Require re-verification when email changes
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    });

    return NextResponse.json({
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      reminderDays: user.reminderDays,
      reminderTime: user.reminderTime,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
