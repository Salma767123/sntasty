import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import nodemailer from "nodemailer";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";

async function getEmailConfig() {
  const dbConfig = await Settings.findOne();
  if (dbConfig?.smtp?.host && dbConfig?.smtp?.user && dbConfig?.smtp?.password) {
    return {
      host: dbConfig.smtp.host,
      port: parseInt(String(dbConfig.smtp.port)) || 587,
      auth: { user: dbConfig.smtp.user, pass: decryptPassword(dbConfig.smtp.password) },
      from: dbConfig.contactEmail || dbConfig.smtp.user,
      secure: parseInt(String(dbConfig.smtp.port)) === 465,
      tls: { rejectUnauthorized: false },
      shopName: dbConfig.shopName || "Sai Nandhini Tasty World",
    };
  }
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD },
    from: process.env.SMTP_USER,
    secure: Number(process.env.SMTP_PORT) === 465,
    tls: { rejectUnauthorized: false },
    shopName: "Sai Nandhini Tasty World",
  };
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this email
    await PasswordReset.updateMany({ email: user.email, used: false }, { used: true });

    // Save new token
    await PasswordReset.create({ email: user.email, token, expiresAt });

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    const emailConfig = await getEmailConfig() as any;
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
      tls: emailConfig.tls,
    });

    await transporter.sendMail({
      from: `"${emailConfig.shopName}" <${emailConfig.from}>`,
      to: user.email,
      subject: `Reset Your Password - ${emailConfig.shopName}`,
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px 30px;background:#fff;border-radius:16px;border:1px solid #f0f0f0;">
          <h2 style="color:#234d1b;font-size:24px;margin-bottom:8px;">Reset Your Password</h2>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:24px;">
            We received a request to reset the password for your account. Click the button below to set a new password.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#234d1b;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.5px;">
            Reset Password
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;line-height:1.6;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
          <p style="color:#d1d5db;font-size:11px;text-align:center;">${emailConfig.shopName}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request. Please try again." }, { status: 500 });
  }
}
