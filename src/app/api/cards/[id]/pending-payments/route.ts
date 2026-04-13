import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPendingSchema = z.object({
  amountPaid: z.number().positive(),
  paidDate: z.string(),
  description: z.string().optional(),
  daysToPost: z.number().int().min(1).max(14),
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

    const pending = await prisma.pendingPayment.findMany({
      where: { cardId: id },
      orderBy: { paidDate: "desc" },
    });

    return NextResponse.json(pending);
  } catch (error) {
    console.error("Get pending payments error:", error);
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
    const parsed = createPendingSchema.safeParse({
      ...body,
      amountPaid: parseFloat(body.amountPaid),
      daysToPost: parseInt(body.daysToPost, 10) || 3,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const pending = await prisma.pendingPayment.create({
      data: {
        cardId: id,
        amountPaid: parsed.data.amountPaid,
        paidDate: new Date(parsed.data.paidDate),
        description: parsed.data.description || null,
        daysToPost: parsed.data.daysToPost,
      },
    });

    return NextResponse.json(pending);
  } catch (error) {
    console.error("Create pending payment error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
