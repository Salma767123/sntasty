import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import connectDB from "@/lib/mongodb";
import PasswordReset from "@/models/PasswordReset";
import { client } from "@/lib/mongodb-client";
import { hashPassword } from "better-auth/crypto";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectDB();

    // Find valid token
    const resetRecord = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
    }

    const db = client.db();

    // Find user by email
    const user = await db.collection("user").findOne({
      email: resetRecord.email,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash password using better-auth's own hashing function
    const hashedPassword = await hashPassword(password);
    const userObjectId = new ObjectId(user._id.toString());

    // Update the password in better-auth's account collection
    // Try both ObjectId and string userId formats for compatibility
    const updateResult = await db.collection("account").updateOne(
      { userId: userObjectId, providerId: "credential" },
      { $set: { password: hashedPassword, updatedAt: new Date() } },
    );

    if (updateResult.matchedCount === 0) {
      // Try string format (some accounts may have string userId)
      const stringUpdate = await db.collection("account").updateOne(
        { userId: user._id.toString(), providerId: "credential" },
        { $set: { password: hashedPassword, userId: userObjectId, updatedAt: new Date() } },
      );

      // If still no match, create a new credential account
      if (stringUpdate.matchedCount === 0) {
        await db.collection("account").insertOne({
          userId: userObjectId,
          providerId: "credential",
          accountId: user._id.toString(),
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Mark token as used
    resetRecord.used = true;
    await resetRecord.save();

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now login." });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
