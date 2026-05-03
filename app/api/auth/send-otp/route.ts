import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Rate-limit: don't send more than once per minute
  const recent = await prisma.emailOtpToken.findFirst({
    where: {
      email,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
  });
  if (recent) {
    return NextResponse.json({ error: "Please wait 1 minute before requesting another OTP" }, { status: 429 });
  }

  // Delete any existing OTPs for this email
  await prisma.emailOtpToken.deleteMany({ where: { email } });

  const otp = generateOtp();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.emailOtpToken.create({ data: { email, otp, expires } });

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return NextResponse.json({ error: "Failed to send OTP. Check RESEND_API_KEY." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
