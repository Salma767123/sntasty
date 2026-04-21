import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import Settings from "@/models/Settings";
import HeroSlide from "@/models/HeroSlide";
import { unstable_cache } from "next/cache";

// Select only fields the ShopClient component needs
const PRODUCT_LIST_FIELDS = "_id slug images name price mrp rating tag category stock variants badge uom";
// Select only fields CategorySection/ShopClient needs
const CATEGORY_LIST_FIELDS = "_id name slug image description";
// Select only fields HeroCarousel needs
const HERO_SLIDE_FIELDS = "title titleAccent tag description image ctaText ctaLink badge1 badge2";

export const getProducts = unstable_cache(
  async () => {
    await connectDB();
    const products = await Product.find({ isActive: { $ne: false } })
      .select(PRODUCT_LIST_FIELDS)
      .populate('subCategory', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(products));
  },
  ["products"],
  { tags: ["products"], revalidate: 60 }
);

// Home page only needs 8 featured products — avoid fetching entire catalog
export async function getFeaturedProducts(limit: number = 8) {
  return unstable_cache(
    async () => {
      await connectDB();
      const products = await Product.find({ isActive: { $ne: false } })
        .select(PRODUCT_LIST_FIELDS)
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(limit)
        .lean();
      return JSON.parse(JSON.stringify(products));
    },
    [`featured-${limit}`],
    { tags: ["featured-products"], revalidate: 60 }
  )();
}

export const getCategories = unstable_cache(
  async () => {
    await connectDB();
    const categories = await Category.find({ isActive: { $ne: false } })
      .select(CATEGORY_LIST_FIELDS)
      .sort({ order: 1 })
      .lean();
    return JSON.parse(JSON.stringify(categories));
  },
  ["categories"],
  { tags: ["categories"], revalidate: 60 }
);

export const getSettings = unstable_cache(
  async () => {
    await connectDB();
    const settings = await Settings.findOne()
      .select("manageInventory aboutUs ourStory whyChooseUs")
      .lean();
    return JSON.parse(JSON.stringify(settings || {}));
  },
  ["settings-public"],
  { tags: ["settings-public"], revalidate: 60 }
);

export const getHeroSlides = unstable_cache(
  async () => {
    await connectDB();
    const slides = await HeroSlide.find({ isActive: { $ne: false } })
      .select(HERO_SLIDE_FIELDS)
      .sort({ order: 1 })
      .lean();
    return JSON.parse(JSON.stringify(slides));
  },
  ["hero-slides"],
  { tags: ["hero-slides"], revalidate: 60 }
);

export async function getProductBySlug(slug: string) {
  return unstable_cache(
    async () => {
      await connectDB();
      const product = await Product.findOne({ slug, isActive: { $ne: false } }).lean();
      return product ? JSON.parse(JSON.stringify(product)) : null;
    },
    [`product-${slug}`],
    { tags: ["products"], revalidate: 30 }
  )();
}
