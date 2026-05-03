import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, mobile, password, firmName, otp } = body;

  if (!name || !email || !password || !otp) {
    return NextResponse.json({ error: "All fields including OTP are required" }, { status: 400 });
  }

  // Verify OTP
  const otpRecord = await prisma.emailOtpToken.findFirst({
    where: { email, otp },
  });

  if (!otpRecord) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  if (new Date() > otpRecord.expires) {
    await prisma.emailOtpToken.delete({ where: { id: otpRecord.id } });
    return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, mobile: mobile || null, password: hashed, firmName: firmName || null },
  });

  // Clean up OTP
  await prisma.emailOtpToken.deleteMany({ where: { email } });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
