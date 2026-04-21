import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import SubCategory from "@/models/SubCategory";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS, cached } from "@/lib/cache";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isAdmin = searchParams.get("admin") === "true"; // New param to bypass for admin view
    const exclude = searchParams.get("exclude"); // Exclude specific product ID
    const limit = searchParams.get("limit"); // Limit number of results

    const query: any = category ? { category } : {};

    if (!isAdmin) {
      query.isActive = true;
    }

    // Exclude specific product (for related products)
    if (exclude) {
      query._id = { $ne: exclude };
    }

    // Inventory Filtering (cached to avoid DB hit on every request)
    if (!isAdmin) {
      const manageInventory = await cached("settings-inventory", 300_000, async () => {
        const Settings = (await import("@/models/Settings")).default;
        const settings = await Settings.findOne().select("manageInventory").lean();
        return settings?.manageInventory ?? true;
      });

      if (manageInventory) {
        // If managing inventory, only show products where:
        // 1. Base stock > 0
        // 2. OR at least one variant has stock > 0
        query.$or = [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }];
      }
    }

    let productsQuery = Product.find(query).sort({ createdAt: -1 }).populate('subCategory', 'name slug');

    // Apply limit if specified
    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }

    const products = await productsQuery;
    return NextResponse.json(products);
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
    const contentType = req.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      // Standalone upload for ImageUpload component
      if (file && !formData.get("data")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
        const { secure_url } = await uploadToCloudinary(
          base64Image,
          "sainandhini/products",
        );
        return NextResponse.json({ secure_url });
      }

      const dataStr = formData.get("data") as string;
      if (!dataStr) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
      }

      const body = JSON.parse(dataStr);
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
      
      // Clean subCategory: convert empty string to undefined
      if (body.subCategory === "" || body.subCategory === null) {
        delete body.subCategory;
      }
      
      const product = await Product.create(body);

      // Revalidate affected pages
      revalidatePublicData(
        [CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG],
        ["/", "/shop"],
      );
      revalidateTag("products", "default");
      revalidateTag("featured-products", "default");

      return NextResponse.json(product, { status: 201 });
    }

    return NextResponse.json(
      { error: "Unsupported media type" },
      { status: 415 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
