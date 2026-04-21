import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Enquiry from "@/models/Enquiry";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const enquiries = await Enquiry.find({}).sort({ createdAt: -1 });

    return NextResponse.json(enquiries);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch enquiries" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 },
      );
    }

    const STATUS_ORDER = ["New", "In Progress", "Completed"];

    if (!STATUS_ORDER.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    await connectDB();
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    // Enforce forward-only status progression
    const currentIdx = STATUS_ORDER.indexOf(enquiry.status);
    const newIdx = STATUS_ORDER.indexOf(status);
    if (newIdx < currentIdx) {
      return NextResponse.json(
        { error: "Status cannot be reverted to a previous stage" },
        { status: 400 },
      );
    }

    enquiry.status = status;
    await enquiry.save();

    return NextResponse.json(enquiry);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update enquiry status" },
      { status: 500 },
    );
  }
}
