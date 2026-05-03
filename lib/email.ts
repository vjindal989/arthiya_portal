import nodemailer from "nodemailer";

const APP_NAME = "Arhatiya Portal";

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function from() {
  return `${APP_NAME} <${process.env.GMAIL_USER}>`;
}

export async function sendOtpEmail(email: string, otp: string) {
  await getTransporter().sendMail({
    from: from(),
    to: email,
    subject: `${otp} — Your ${APP_NAME} verification code`,
    text: `Your ${APP_NAME} verification code is:\n\n${otp}\n\nValid for 10 minutes. Do not share this with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#1a1a1a">${APP_NAME}</h2>
        <p>Your verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a1a;padding:16px;background:#f4f4f4;border-radius:8px;text-align:center">${otp}</div>
        <p style="color:#666;font-size:13px">Valid for 10 minutes. Do not share this code.</p>
      </div>
    `,
  });
}

export async function sendResetEmail(email: string, resetUrl: string) {
  await getTransporter().sendMail({
    from: from(),
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#1a1a1a">${APP_NAME}</h2>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Reset Password</a>
        <p style="color:#666;font-size:13px;margin-top:16px">This link expires in 1 hour. If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}
