import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    // Fetch approved reviews for the product
    const reviews = await Review.find({ product: id, isApproved: true })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate rating statistics
    const stats = await Review.aggregate([
      { 
        $match: { 
          product: new mongoose.Types.ObjectId(id), 
          isApproved: true 
        } 
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    stats.forEach((stat: any) => {
      ratingBreakdown[stat._id as keyof typeof ratingBreakdown] = stat.count;
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r: any) => sum + r.rating, 0) / totalReviews
        : 0;

    let canReview = false;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user) {
        const isAdmin = session.user.role === "admin";
        const hasBought = await Order.findOne({
          user: session.user.id,
          "orderItems.product": id,
          $or: [{ status: "Delivered" }, { isDelivered: true }],
        });
        if (hasBought || isAdmin) {
          const alreadyReviewed = await Review.findOne({
            user: session.user.id,
            product: id,
          });
          canReview = !alreadyReviewed;
        }
      }
    } catch (err) {
      console.error("Session check error:", err);
    }

    return NextResponse.json({
      reviews: reviews.map((r: any) => ({
        _id: r._id,
        rating: r.rating,
        comment: r.comment,
        userName: r.user?.name || "Anonymous",
        createdAt: r.createdAt,
      })),
      stats: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews,
        ratingBreakdown,
      },
      canReview,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
