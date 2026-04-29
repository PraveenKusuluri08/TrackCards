import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [unreadCount, notifications] = await Promise.all([
      prisma.inAppNotification.count({
        where: { userId: session.user.id, readAt: null },
      }),
      prisma.inAppNotification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          eventDate: true,
          readAt: true,
          createdAt: true,
          cardId: true,
        },
      }),
    ]);

    return NextResponse.json({ unreadCount, notifications });
  } catch (error) {
    console.error("Get in-app notifications error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

