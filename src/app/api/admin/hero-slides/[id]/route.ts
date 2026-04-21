import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HeroSlide from "@/models/HeroSlide";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getUrlFromPublicId,
  getPublicIdFromUrl,
} from "@/lib/cloudinary";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const existing = await HeroSlide.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Slide not found" },
        { status: 404 },
      );
    }

    const formData = await req.formData();
    const updateData: any = {};

    // Extract fields from FormData
    formData.forEach((value, key) => {
      if (key !== "file") {
        if (key === "isActive") updateData[key] = value === "true";
        else if (key === "order") updateData[key] = Number(value);
        else updateData[key] = value;
      }
    });

    // Ensure ctaLink is never empty
    if ("ctaLink" in updateData && !updateData.ctaLink) {
      updateData.ctaLink = "/shop";
    }
    if ("ctaText" in updateData && !updateData.ctaText) {
      updateData.ctaText = "Shop Now";
    }

    const file = formData.get("file") as File;
    if (file && file instanceof File) {
      // New file → delete old and upload
      if (existing.image && !existing.image.startsWith("http")) {
        await deleteFromCloudinary(existing.image);
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
      const result = await uploadToCloudinary(base64Image, "sainandhini/hero");
      updateData.image = result.public_id;
    } else if (updateData.image && updateData.image.startsWith("http")) {
      // Normalize URL to publicId if it's Cloudinary
      const publicId = getPublicIdFromUrl(updateData.image);
      updateData.image = publicId || updateData.image;
    }

    // Auto-resequence display order when it changes
    if ("order" in updateData && updateData.order !== existing.order) {
      const newOrder = updateData.order || 1;
      const oldOrder = existing.order;

      if (newOrder < oldOrder) {
        // Moving up: shift slides in [newOrder, oldOrder-1] down by 1
        await HeroSlide.updateMany(
          { _id: { $ne: id }, order: { $gte: newOrder, $lt: oldOrder } },
          { $inc: { order: 1 } },
        );
      } else {
        // Moving down: shift slides in [oldOrder+1, newOrder] up by 1
        await HeroSlide.updateMany(
          { _id: { $ne: id }, order: { $gt: oldOrder, $lte: newOrder } },
          { $inc: { order: -1 } },
        );
      }
    }

    const slide = await HeroSlide.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Revalidate home page to show updated banner immediately
    revalidatePublicData([CACHE_KEYS.HERO_SLIDES], ["/"]);
    revalidateTag("hero-slides", "default");

    return NextResponse.json({
      success: true,
      message: "Slide updated",
      data: {
        ...slide._doc,
        image:
          slide.image && !slide.image.startsWith("http")
            ? getUrlFromPublicId(slide.image)
            : slide.image,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const slide = await HeroSlide.findById(id);
    if (!slide)
      return NextResponse.json(
        { success: false, message: "Slide not found" },
        { status: 404 },
      );

    if (slide.image && !slide.image.startsWith("http")) {
      await deleteFromCloudinary(slide.image);
    }

    await HeroSlide.findByIdAndDelete(id);
    
    // Revalidate home page to reflect deleted banner
    revalidatePublicData([CACHE_KEYS.HERO_SLIDES], ["/"]);
    revalidateTag("hero-slides", "default");
    
    return NextResponse.json({ success: true, message: "Slide deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
