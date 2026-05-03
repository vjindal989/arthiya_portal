import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to avoid email enumeration
  if (!user) return NextResponse.json({ resetUrl: null, message: "If that email exists, a link was generated." });

  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({ data: { email, token, expires } });

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  return NextResponse.json({ resetUrl });
}
