import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Page from "@/models/Page";

// GET /api/page?slug=terms-of-service
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        const page = await Page.findOne({ slug });

        if (!page) {
            return NextResponse.json({ message: "Page not found" }, { status: 404 });
        }

        return NextResponse.json(page);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
