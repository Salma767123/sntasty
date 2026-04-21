import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Page from "@/models/Page";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// GET /api/admin/page?slug=terms-of-service
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
      // Return empty if not created yet
      return NextResponse.json({ title: "", content: "" });
    }

    return NextResponse.json(page);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/page

// POST /api/admin/page

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { slug, title, content } = await req.json();

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let page = await Page.findOne({ slug });

    if (page) {
      page.title = title;
      page.content = content;
      page.lastUpdated = Date.now();
      await page.save();
      revalidatePath(`/legal/${slug}`);
      return NextResponse.json({ message: "Page updated successfully", page });
    } else {
      page = await Page.create({ slug, title, content });
      revalidatePath(`/legal/${slug}`);
      return NextResponse.json(
        { message: "Page created successfully", page },
        { status: 201 },
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
