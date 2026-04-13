import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCardSchema = z.object({
  cardName: z.string().min(1).optional(),
  issuerName: z.string().min(1).optional(),
  lastFourDigits: z.string().optional(),
  creditLimit: z.number().positive().optional(),
  currentBalance: z.number().min(0).optional(),
  minimumDue: z.number().min(0).optional(),
  fullDue: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  statementDate: z.string().optional(),
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
      include: { paymentHistory: { orderBy: { paidDate: "desc" }, take: 10 } },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Get card error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.creditCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.cardName !== undefined) updates.cardName = body.cardName;
    if (body.issuerName !== undefined) updates.issuerName = body.issuerName;
    if (body.lastFourDigits !== undefined) updates.lastFourDigits = body.lastFourDigits || null;
    if (body.creditLimit !== undefined) updates.creditLimit = parseFloat(body.creditLimit);
    if (body.currentBalance !== undefined) updates.currentBalance = parseFloat(body.currentBalance);
    if (body.minimumDue !== undefined) updates.minimumDue = parseFloat(body.minimumDue);
    if (body.fullDue !== undefined) updates.fullDue = parseFloat(body.fullDue);
    if (body.dueDate !== undefined) updates.dueDate = new Date(body.dueDate);
    if (body.statementDate !== undefined) updates.statementDate = new Date(body.statementDate);

    const parsed = updateCardSchema.safeParse(updates);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const card = await prisma.creditCard.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Update card error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.creditCard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.creditCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete card error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
