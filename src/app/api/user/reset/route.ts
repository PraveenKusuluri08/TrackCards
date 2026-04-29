import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  confirm: z.literal("RESET"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Type "RESET" to confirm.' }, { status: 400 });
    }

    const userId = session.user.id;

    // Delete all user-owned financial data. Keep the user account itself.
    await prisma.$transaction([
      prisma.inAppNotification.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.balanceSnapshot.deleteMany({ where: { userId } }),
      prisma.paymentHistory.deleteMany({ where: { card: { userId } } }),
      prisma.pendingPayment.deleteMany({ where: { card: { userId } } }),
      prisma.creditCard.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset user data error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

