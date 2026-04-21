import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import StockTransaction from "@/models/StockTransaction";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const query = productId ? { product: productId } : {};
    const transactions = await StockTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    return NextResponse.json(transactions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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
    const body = await req.json();
    const {
      productId,
      variantSku,
      type,
      quantity,
      reason,
      costPerUnit,
      supplier,
    } = body;

    const product = await Product.findById(productId);
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let previousStock = 0;
    let newStock = 0;
    let stockIndex = -1;

    // Identify which stock to update (Variant or Main)
    if (product.variants && product.variants.length > 0) {
      if (!variantSku)
        return NextResponse.json(
          { error: "Variant SKU is required for variant products" },
          { status: 400 },
        );

      stockIndex = product.variants.findIndex((v: any) => v.uom === variantSku);
      if (stockIndex === -1)
        return NextResponse.json(
          { error: "Variant not found" },
          { status: 404 },
        );

      previousStock = product.variants[stockIndex].stock || 0;
    } else {
      previousStock = product.stock || 0;
    }

    // Calculate new stock based on the quantity change provided
    // We assume 'quantity' is the delta (positive or negative)
    newStock = previousStock + Number(quantity);

    if (newStock < 0) newStock = 0; // Prevent negative stock

    // Update Product Model
    if (stockIndex !== -1) {
      product.variants[stockIndex].stock = newStock;
    } else {
      product.stock = newStock;
    }
    await product.save();

    // Create Transaction Record
    const transaction = await StockTransaction.create({
      product: productId,
      productName: product.name,
      variantSku: variantSku || null,
      type,
      quantity: Number(quantity),
      previousStock,
      newStock,
      reason,
      costPerUnit,
      supplier,
    });

    revalidatePublicData([CACHE_KEYS.PRODUCTS, CACHE_KEYS.FEATURED, CACHE_KEYS.PRODUCT_SLUG]);
    revalidateTag("products", "default");
    revalidateTag("featured-products", "default");
    return NextResponse.json({ success: true, transaction, newStock });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
