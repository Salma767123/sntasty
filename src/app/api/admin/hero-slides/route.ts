import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import HeroSlide from "@/models/HeroSlide";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToCloudinary, getUrlFromPublicId } from "@/lib/cloudinary";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

/* ────────── Seed defaults if collection is empty ────────── */
let seedingPromise: Promise<void> | null = null;

const seedDefaults = async () => {
  if (seedingPromise) return seedingPromise;
  const count = await HeroSlide.countDocuments();
  if (count > 0) return;

  const defaults = [
    {
      title: "Freshly Baked",
      titleAccent: "Cookies",
      tag: "Bestseller",
      description: "Irresistible homemade cookies baked fresh daily.",
      image:
        "https://images.pexels.com/photos/890577/pexels-photo-890577.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      ctaText: "Shop Cookies",
      ctaLink: "/shop?category=Cookies",
      badge1: "Freshly Baked",
      badge2: "Premium Butter",
      order: 1,
      isActive: true,
    },
  ];

  seedingPromise = HeroSlide.insertMany(defaults).then(() => {
    console.log("✅ Default hero slides seeded");
    seedingPromise = null;
  });
  return seedingPromise;
};

export async function GET(req: Request) {
  try {
    await connectDB();
    await seedDefaults();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly");
    const query: any = {};
    if (activeOnly === "true") query.isActive = true;

    const slides = await HeroSlide.find(query).sort({
      order: 1,
      createdAt: -1,
    });
    const slidesWithUrls = slides.map((s: any) => ({
      ...s._doc,
      image:
        s.image && !s.image.startsWith("http")
          ? getUrlFromPublicId(s.image)
          : s.image,
    }));
    return NextResponse.json({ success: true, data: slidesWithUrls });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const titleAccent = formData.get("titleAccent") as string;
    const tag = formData.get("tag") as string;
    const description = formData.get("description") as string;
    const ctaText = formData.get("ctaText") as string;
    const ctaLink = formData.get("ctaLink") as string;
    const badge1 = formData.get("badge1") as string;
    const badge2 = formData.get("badge2") as string;
    const isActive = formData.get("isActive") === "true";
    const order = Number(formData.get("order")) || 0;

    const file = formData.get("file") as File;
    const existingImage = formData.get("image") as string;

    let imageValue = existingImage;

    if (file && file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
      const result = await uploadToCloudinary(base64Image, "sainandhini/hero");
      imageValue = result.public_id;
    }

    if (!title || !imageValue) {
      return NextResponse.json(
        { success: false, message: "Title and Image are required" },
        { status: 400 },
      );
    }

    // Auto-resequence: shift existing slides at or after this order position down
    const targetOrder = order || 1;
    await HeroSlide.updateMany(
      { order: { $gte: targetOrder } },
      { $inc: { order: 1 } },
    );

    const slide = new HeroSlide({
      title,
      titleAccent,
      tag,
      description,
      image: imageValue,
      ctaText: ctaText || "Shop Now",
      ctaLink: ctaLink || "/shop",
      badge1,
      badge2,
      isActive,
      order: targetOrder,
    });

    await slide.save();
    
    revalidatePublicData([CACHE_KEYS.HERO_SLIDES], ["/"]);
    revalidateTag("hero-slides", "default");

    return NextResponse.json({
      success: true,
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
