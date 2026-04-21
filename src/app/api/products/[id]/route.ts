import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    let body;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const dataStr = formData.get("data") as string;

      if (!dataStr) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
      }

      body = JSON.parse(dataStr);
      const newImages = formData.getAll("newImages") as File[];
      const uploadedUrls = [];

      for (const file of newImages) {
        if (!file || !(file instanceof File)) continue;
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
        const { secure_url } = await uploadToCloudinary(
          base64Image,
          "sainandhini/products",
        );
        uploadedUrls.push(secure_url);
      }

      body.images = [...(body.images || []), ...uploadedUrls];
    } else {
      body = await req.json();
    }

    // Clean subCategory: convert empty string to undefined
    if (body.subCategory === "" || body.subCategory === null) {
      delete body.subCategory;
    }

    const product = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    revalidatePublicData(
      [CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG],
      ["/", "/shop", `/shop/${product.slug}`],
    );
    revalidateTag("products", "default");
    revalidateTag("featured-products", "default");

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const product = await Product.findByIdAndDelete(id);
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    revalidatePublicData(
      [CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG],
      ["/", "/shop"],
    );
    revalidateTag("products", "default");
    revalidateTag("featured-products", "default");

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
