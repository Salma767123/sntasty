import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

// GET all reviews for admin (pending and approved)
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "all";

    let query: any = {};
    if (filter === "pending") {
      query.isApproved = false;
    } else if (filter === "approved") {
      query.isApproved = true;
    }

    const reviews = await Review.find(query)
      .populate("user", "name email")
      .populate("product", "name image")
      .sort("-createdAt");

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("GET admin reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

// PUT to approve/reject a review
export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id, isApproved } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 },
      );
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true },
    );

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // If approved, update product rating and review count
    if (isApproved) {
      const allApprovedReviews = await Review.find({
        product: review.product,
        isApproved: true,
      });

      const numReviews = allApprovedReviews.length;
      const totalRating = allApprovedReviews.reduce(
        (acc, item) => acc + item.rating,
        0,
      );
      const averageRating = numReviews > 0 ? totalRating / numReviews : 0;

      await Product.findByIdAndUpdate(review.product, {
        rating: Number(averageRating.toFixed(1)),
        numReviews,
      });
    } else {
      // If unapproved, also update product rating and review count to reflect the removal
      const allApprovedReviews = await Review.find({
        product: review.product,
        isApproved: true,
      });

      const numReviews = allApprovedReviews.length;
      const totalRating = allApprovedReviews.reduce(
        (acc, item) => acc + item.rating,
        0,
      );
      const averageRating = numReviews > 0 ? totalRating / numReviews : 0;

      await Product.findByIdAndUpdate(review.product, {
        rating: Number(averageRating.toFixed(1)),
        numReviews,
      });
    }

    revalidatePublicData([CACHE_KEYS.PRODUCTS, CACHE_KEYS.PRODUCT_SLUG]);
    revalidateTag("products", "default");
    return NextResponse.json(review);
  } catch (error) {
    console.error("PUT admin reviews error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}

// DELETE a review
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 },
      );
    }

    const review = await Review.findByIdAndDelete(id);

    if (review && review.isApproved) {
      const allApprovedReviews = await Review.find({
        product: review.product,
        isApproved: true,
      });

      const numReviews = allApprovedReviews.length;
      const totalRating = allApprovedReviews.reduce(
        (acc, item) => acc + item.rating,
        0,
      );
      const averageRating = numReviews > 0 ? totalRating / numReviews : 0;

      await Product.findByIdAndUpdate(review.product, {
        rating: Number(averageRating.toFixed(1)),
        numReviews,
      });
    }

    revalidatePublicData([CACHE_KEYS.PRODUCTS, CACHE_KEYS.PRODUCT_SLUG]);
    revalidateTag("products", "default");
    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("DELETE admin reviews error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
