import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Drop the old ShippingRate collection to remove old schema
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.dropCollection("shippingrates");
        console.log("✅ Old shipping rates collection dropped successfully");
      }
    } catch (error: any) {
      // Collection might not exist or already dropped
      console.log("ℹ️ Collection drop skipped:", error.message);
    }

    // Also clear the mongoose model cache
    if (mongoose.models.ShippingRate) {
      delete mongoose.models.ShippingRate;
    }

    return NextResponse.json({
      success: true,
      message: "Migration complete! Old shipping rates cleared. Please refresh the page and add new location-based rates."
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
