import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1, "Invalid token"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { token, password } = parsed.data;

    const rows = await prisma.$queryRaw<Array<{ email: string; expires: Date }>>`
      SELECT email, expires FROM password_resets WHERE token = ${token}
    `;
    const reset = rows[0];

    if (!reset || new Date(reset.expires) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset link. Request a new one." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.findUnique({ where: { email: reset.email } });
    await prisma.user.update({
      where: { email: reset.email },
      data: {
        password: hashedPassword,
        // If user never verified email, set it now (they received the reset link = they own the inbox)
        ...(user && !user.emailVerified ? { emailVerified: new Date() } : {}),
      },
    });

    await prisma.$executeRaw`DELETE FROM password_resets WHERE token = ${token}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
