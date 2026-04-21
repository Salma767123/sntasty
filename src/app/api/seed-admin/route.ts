import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { client } from "@/lib/mongodb-client";
import crypto from "crypto";

/**
 * Seed Admin User API Route
 * Creates an admin user in the database
 * 
 * Usage: GET /api/seed-admin
 * 
 * SECURITY: This should be disabled in production or protected
 */

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateUserId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET() {
  try {
    // Get admin credentials from environment
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sainandhini.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

    await connectDB();
    const db = client.db();

    // Get collections
    const usersCollection = db.collection('user');
    const accountsCollection = db.collection('account');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ 
      email: ADMIN_EMAIL 
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: "Admin user already exists",
        admin: {
          email: existingAdmin.email,
          role: existingAdmin.role,
          id: existingAdmin.id,
        }
      }, { status: 400 });
    }

    // Create admin user
    const userId = generateUserId();
    const hashedPassword = hashPassword(ADMIN_PASSWORD);
    const now = new Date();

    const adminUser = {
      id: userId,
      email: ADMIN_EMAIL,
      emailVerified: true,
      name: "Admin",
      role: "admin",
      createdAt: now,
      updatedAt: now,
    };

    await usersCollection.insertOne(adminUser);

    // Create email/password account for the admin
    const accountId = generateUserId();
    
    const adminAccount = {
      id: accountId,
      userId: userId,
      accountId: ADMIN_EMAIL,
      providerId: "credential",
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };

    await accountsCollection.insertOne(adminAccount);

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      admin: {
        email: ADMIN_EMAIL,
        role: "admin",
        id: userId,
      },
      credentials: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
      loginUrl: "/admin/login"
    });

  } catch (error: any) {
    console.error("Seed admin error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
