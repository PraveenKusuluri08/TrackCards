import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseLimit(value: string | null, fallback: number): number {
  const n = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"), 90);

    const snapshots = await prisma.balanceSnapshot.findMany({
      where: { userId: session.user.id },
      orderBy: { snapshotDate: "asc" },
      take: limit,
      select: {
        snapshotDate: true,
        totalBalance: true,
        cardBalances: true,
      },
    });

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Get balance snapshots error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

