import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCardSchema = z.object({
  cardName: z.string().min(1, "Card name is required"),
  issuerName: z.string().min(1, "Issuer is required"),
  lastFourDigits: z.string().optional(),
  creditLimit: z.number().positive(),
  currentBalance: z.number().min(0),
  minimumDue: z.number().min(0),
  fullDue: z.number().min(0),
  dueDate: z.string(),
  statementDate: z.string(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cards = await prisma.creditCard.findMany({
      where: { userId: session.user.id },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Get cards error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCardSchema.safeParse({
      ...body,
      creditLimit: parseFloat(body.creditLimit),
      currentBalance: parseFloat(body.currentBalance),
      minimumDue: parseFloat(body.minimumDue),
      fullDue: parseFloat(body.fullDue),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const card = await prisma.creditCard.create({
      data: {
        userId: session.user.id,
        cardName: parsed.data.cardName,
        issuerName: parsed.data.issuerName,
        lastFourDigits: parsed.data.lastFourDigits || null,
        creditLimit: parsed.data.creditLimit,
        currentBalance: parsed.data.currentBalance,
        minimumDue: parsed.data.minimumDue,
        fullDue: parsed.data.fullDue,
        dueDate: new Date(parsed.data.dueDate),
        statementDate: new Date(parsed.data.statementDate),
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Create card error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
