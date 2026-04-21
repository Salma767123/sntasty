import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { getCategoriesData } from "@/lib/admin-data";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

export async function GET() {
  try {
    const categories = await getCategoriesData();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let name, slug, description, imageUrl;
    const contentType = req.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const body = await req.json();
      name = body.name;
      slug = body.slug;
      description = body.description;
      imageUrl = body.image;
    } else {
      const formData = await req.formData();
      name = formData.get("name") as string;
      slug = formData.get("slug") as string;
      description = formData.get("description") as string;

      const file = formData.get("file") as File;
      const existingImage = formData.get("image") as string;

      if (file && file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
        const result = await uploadToCloudinary(
          base64Image,
          "sainandhini/categories",
        );
        imageUrl = result.secure_url;
      } else if (existingImage) {
        imageUrl = existingImage;
      }
    }

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and Slug are required" },
        { status: 400 },
      );
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 },
      );
    }

    const category = await Category.create({
      name,
      slug,
      image: imageUrl,
      description,
    });
    revalidatePublicData([CACHE_KEYS.CATEGORIES, CACHE_KEYS.NAVBAR]);
    revalidateTag("navbar-data", "default");
    revalidateTag("categories", "default");
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    let name, slug, description, imageUrl;
    const contentType = req.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const body = await req.json();
      name = body.name;
      slug = body.slug;
      description = body.description;
      imageUrl = body.image;
    } else {
      const formData = await req.formData();
      name = formData.get("name") as string;
      slug = formData.get("slug") as string;
      description = formData.get("description") as string;

      const file = formData.get("file") as File;
      const existingImage = formData.get("image") as string;

      if (file && file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
        const result = await uploadToCloudinary(
          base64Image,
          "sainandhini/categories",
        );
        imageUrl = result.secure_url;
      } else if (existingImage) {
        imageUrl = existingImage;
      }
    }

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and Slug are required" },
        { status: 400 },
      );
    }

    // Check if slug is already taken by another category
    const existing = await Category.findOne({ slug, _id: { $ne: id } });
    if (existing) {
      return NextResponse.json(
        { error: "Category slug already exists" },
        { status: 400 },
      );
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        image: imageUrl,
        description,
      },
      { new: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    revalidatePublicData([CACHE_KEYS.CATEGORIES, CACHE_KEYS.NAVBAR]);
    revalidateTag("navbar-data", "default");
    revalidateTag("categories", "default");
    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Delete the category
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Also delete associated subcategories (you would need to import SubCategory if it's not already, but we can do it via mongoose model)
    const mongoose = require("mongoose");
    const SubCategory =
      mongoose.models.SubCategory || mongoose.model("SubCategory");
    if (SubCategory) {
      await SubCategory.deleteMany({ parentCategory: id });
    }

    revalidatePublicData([CACHE_KEYS.CATEGORIES, CACHE_KEYS.NAVBAR]);
    revalidateTag("navbar-data", "default");
    revalidateTag("categories", "default");
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
