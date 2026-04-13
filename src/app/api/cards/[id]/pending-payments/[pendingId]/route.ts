import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

    const body = await request.json();
    if (body.balanceUpdated !== true) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const pending = await prisma.pendingPayment.findFirst({
      where: { id: pendingId, cardId: id },
    });

    if (!pending) {
      return NextResponse.json({ error: "Pending payment not found" }, { status: 404 });
    }

    await prisma.pendingPayment.update({
      where: { id: pendingId },
      data: { balanceUpdated: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update pending payment error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.pendingPayment.deleteMany({
      where: { id: pendingId, cardId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete pending payment error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
