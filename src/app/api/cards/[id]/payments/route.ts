import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaymentSchema = z.object({
  amountPaid: z.number().positive(),
  paidDate: z.string(),
  paymentType: z.enum(["minimum", "full", "partial"]),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const card = await prisma.creditCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const payments = await prisma.paymentHistory.findMany({
      where: { cardId: id },
      orderBy: { paidDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const card = await prisma.creditCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createPaymentSchema.safeParse({
      ...body,
      amountPaid: parseFloat(body.amountPaid),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const amountPaid = parsed.data.amountPaid;

    const [payment] = await prisma.$transaction([
      prisma.paymentHistory.create({
        data: {
          cardId: id,
          amountPaid,
          paidDate: new Date(parsed.data.paidDate),
          paymentType: parsed.data.paymentType,
          notes: parsed.data.notes || null,
        },
      }),
      prisma.creditCard.update({
        where: { id },
        data: {
          currentBalance: { decrement: amountPaid },
        },
      }),
    ]);

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
