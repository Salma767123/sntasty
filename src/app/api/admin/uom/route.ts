import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UOM from "@/models/UOM";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET all UOMs
export async function GET() {
  try {
    await connectDB();
    const uoms = await UOM.find({}).sort({ name: 1 });
    return NextResponse.json(uoms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE new UOM
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { name, code, isActive } = await req.json();

    const finalCode = code || name.toLowerCase().replace(/\s+/g, "");

    // Check if exists
    const existing = await UOM.findOne({
      $or: [{ name }, { code: finalCode }],
    });
    if (existing) {
      return NextResponse.json(
        { error: "UOM with this name or code already exists" },
        { status: 400 },
      );
    }

    const uom = await UOM.create({
      name,
      code: finalCode,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(uom, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
