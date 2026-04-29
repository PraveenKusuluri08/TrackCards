import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getBaseUrl } from "@/lib/base-url";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`resend-verification:${ip}`, { windowMs: 15 * 60 * 1000, max: 6 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true, message: "If that email exists, we sent a new verification link." });
    }
    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Email is already verified. You can sign in." });
    }

    await prisma.emailVerification.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await prisma.emailVerification.create({
      data: { userId: user.id, token, expires },
    });

    const baseUrl = getBaseUrl();
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    const result = await sendEmailVerificationEmail(user.email, user.name || "there", verifyUrl);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
