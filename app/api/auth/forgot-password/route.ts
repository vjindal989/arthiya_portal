import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to avoid email enumeration
  if (!user) return NextResponse.json({ ok: true });

  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({ data: { email, token, expires } });

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendResetEmail(email, resetUrl);
  } catch (err) {
    console.error("Failed to send reset email:", err);
    return NextResponse.json({ error: "Failed to send email. Check RESEND_API_KEY." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
