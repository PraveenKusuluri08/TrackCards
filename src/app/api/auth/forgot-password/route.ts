import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`forgot-password:${ip}`, { windowMs: 15 * 60 * 1000, max: 8 });
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
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: "If that email exists, we sent a reset link." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    // Keep only the latest active token per email.
    await prisma.passwordReset.deleteMany({ where: { email } });
    await prisma.passwordReset.create({
      data: { email, token, expires },
      select: { id: true },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const result = await sendPasswordResetEmail(user.email, user.name || "there", resetUrl);

    if (!result.success) {
      console.error("Password reset email failed:", result.error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    } 

    return NextResponse.json({
      success: true,
      message: "If that email exists, we sent a reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
