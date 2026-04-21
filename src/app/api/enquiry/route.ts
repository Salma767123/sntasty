import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Enquiry from "@/models/Enquiry";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        if (!body.name || !body.email || !body.phone || !body.message) {
            return NextResponse.json(
                { error: "Please fill in all required fields" },
                { status: 400 }
            );
        }

        const enquiry = await Enquiry.create(body);

        return NextResponse.json(
            { message: "Enquiry submitted successfully", enquiry },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
