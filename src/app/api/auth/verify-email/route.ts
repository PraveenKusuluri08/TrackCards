import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=InvalidVerification", request.url));
  }

  try {
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification || verification.expires < new Date()) {
      return NextResponse.redirect(new URL("/login?error=ExpiredVerification", request.url));
    }

    await prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    });

    await prisma.emailVerification.delete({ where: { id: verification.id } });

    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(new URL("/login?error=VerificationFailed", request.url));
  }
}
