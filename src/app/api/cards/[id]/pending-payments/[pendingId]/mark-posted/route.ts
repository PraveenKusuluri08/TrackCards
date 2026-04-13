import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; pendingId: string }> }
) {
  try {
    const session = await auth();
    const { id, pendingId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const card = await prisma.creditCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const pending = await prisma.pendingPayment.findFirst({
      where: { id: pendingId, cardId: id },
    });

    if (!pending) {
      return NextResponse.json({ error: "Pending payment not found" }, { status: 404 });
    }

    const amountPaid = Number(pending.amountPaid);

    await prisma.$transaction([
      prisma.paymentHistory.create({
        data: {
          cardId: id,
          amountPaid: pending.amountPaid,
          paidDate: pending.paidDate,
          paymentType: "partial",
          notes: pending.description || "Posted from pending payment",
        },
      }),
      prisma.creditCard.update({
        where: { id },
        data: {
          currentBalance: { decrement: amountPaid },
        },
      }),
      prisma.pendingPayment.delete({
        where: { id: pendingId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark posted error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
