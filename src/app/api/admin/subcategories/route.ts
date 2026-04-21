import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SubCategory from "@/models/SubCategory";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

function makeSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const scope = searchParams.get("scope"); // "library" | "mapped" | null

    let query: any = {};
    if (categoryId) {
      query = { parentCategory: categoryId };
    } else if (scope === "library") {
      query = { parentCategory: null };
    } else if (scope === "mapped") {
      query = { parentCategory: { $ne: null } };
    }

    const subCategories = await SubCategory.find(query).populate(
      "parentCategory",
      "name",
    );

    return NextResponse.json(subCategories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    await connectDB();
    const body = await req.json();
    const { name, categoryId, description, templateId } = body;

    // Map mode: duplicate a library template onto a category
    if (templateId && categoryId) {
      const template = await SubCategory.findById(templateId);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      const existing = await SubCategory.findOne({
        name: template.name,
        parentCategory: categoryId,
      });
      if (existing) {
        return NextResponse.json(
          { error: "This subcategory is already mapped to the category" },
          { status: 409 },
        );
      }

      const slug = `${makeSlug(template.name)}-${categoryId}`;
      const created = await SubCategory.create({
        name: template.name,
        slug,
        parentCategory: categoryId,
        description: template.description,
      });
      revalidatePublicData([CACHE_KEYS.CATEGORIES]);
      revalidateTag("categories", "default");
      return NextResponse.json(created, { status: 201 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const baseSlug = makeSlug(name);

    // Library template (no category attached)
    if (!categoryId) {
      const existing = await SubCategory.findOne({
        name: name.trim(),
        parentCategory: null,
      });
      if (existing) {
        return NextResponse.json(
          { error: "A library subcategory with this name already exists" },
          { status: 409 },
        );
      }

      const created = await SubCategory.create({
        name: name.trim(),
        slug: baseSlug,
        parentCategory: null,
        description,
      });
      revalidatePublicData([CACHE_KEYS.CATEGORIES]);
      revalidateTag("categories", "default");
      return NextResponse.json(created, { status: 201 });
    }

    // Direct mapped subcategory (legacy path, kept for compatibility)
    const existingMapped = await SubCategory.findOne({
      name: name.trim(),
      parentCategory: categoryId,
    });
    if (existingMapped) {
      return NextResponse.json(
        { error: "Subcategory already exists under this category" },
        { status: 409 },
      );
    }

    const slug = `${baseSlug}-${categoryId}`;
    const subCategory = await SubCategory.create({
      name: name.trim(),
      slug,
      parentCategory: categoryId,
      description,
    });

    revalidatePublicData([CACHE_KEYS.CATEGORIES]);
    revalidateTag("categories", "default");
    return NextResponse.json(subCategory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Subcategory ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const deletedSubCategory = await SubCategory.findByIdAndDelete(id);

    if (!deletedSubCategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 },
      );
    }

    revalidatePublicData([CACHE_KEYS.CATEGORIES]);
    revalidateTag("categories", "default");
    return NextResponse.json({ message: "Subcategory deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
