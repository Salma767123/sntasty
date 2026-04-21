import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { invalidateCache, CACHE_KEYS } from "@/lib/cache";

// GET public reviews for a product
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const reviews = await Review.find({ product: productId, isApproved: true })
      .populate("user", "name")
      .sort("-createdAt");

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("GET reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

// POST a new review (only for buyers)
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { productId, rating, comment } = await req.json();

    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const isAdmin = session.user.role === "admin";
    const hasBought = await Order.findOne({
      user: session.user.id,
      "orderItems.product": productId,
      $or: [{ status: "Delivered" }, { isDelivered: true }],
    });

    console.log("Review Check - session.user.id:", session.user.id);
    console.log("Review Check - role:", session.user.role);
    console.log("Review Check - productId:", productId);
    console.log("Review Check - hasBought:", !!hasBought);

    if (!hasBought && !isAdmin) {
      return NextResponse.json(
        { error: "You can only review products you have bought and received." },
        { status: 403 },
      );
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user: session.user.id,
      product: productId,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 400 },
      );
    }

    const review = await Review.create({
      product: productId,
      user: session.user.id,
      rating: Number(rating),
      comment,
      isApproved: false, // Requires admin approval
    });

    invalidateCache(CACHE_KEYS.PRODUCTS, CACHE_KEYS.PRODUCT_SLUG);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("POST review error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}
