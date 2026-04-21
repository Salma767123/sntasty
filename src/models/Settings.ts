import mongoose, { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema(
  {
    shopName: { type: String, default: "Sai Nandhini Tasty World" },
    contactEmail: { type: String, default: "info@sainandhini.com" },
    contactPhone: { type: String, default: "+91 96009 16065" },
    address: {
      type: String,
      default:
        "# 3/81, 1st Floor, Kaveri Main Street, SRV Nagar, Thirunagar, Madurai - 625006",
    },
    taxRates: [
      {
        name: { type: String, required: true },
        rate: { type: Number, required: true }, // Percentage
        isDefault: { type: Boolean, default: false },
      },
    ],
    announcement: {
      type: String,
      default: "Welcome to our store!",
    },
    minOrderValue: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    manageInventory: { type: Boolean, default: true },
    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },
    socialMedia: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    shippingByWeight: { type: Boolean, default: false },
    allowOrderCancellation: { type: Boolean, default: true },
    allowScheduledOrders: { type: Boolean, default: false },
    isMaintenanceMode: { type: Boolean, default: false },
    seo: {
      metaTitle: {
        type: String,
        default: "Sai Nandhini Tasty World - Authentic Pickles & Sweets",
      },
      metaDescription: {
        type: String,
        default:
          "Discover the authentic taste of South India with our homemade pickles, sweets, and snacks. Freshly made and delivered to your doorstep.",
      },
      keywords: {
        type: String,
        default: "pickles, sweets, snacks, homemade, indian food, authentic",
      },
      ogImage: { type: String, default: "" },
    },
    payment: {
      razorpayKeyId: { type: String, default: "" },
      razorpayKeySecret: { type: String, default: "" },
      razorpayWebhookSecret: { type: String, default: "" },
    },
    smtp: {
      host: { type: String, default: "" },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: "" },
      password: { type: String, default: "" },
    },
    googleMyBusiness: {
      placeId: { type: String, default: "" },
      apiKey: { type: String, default: "" },
      enabled: { type: Boolean, default: false },
    },
    aboutUs: {
      heroTitle: { type: String, default: "Preserving the Soul of South India." },
      heroDescription: { type: String, default: "At Sai Nandhini Tasty World, we believe that food is more than just sustenance; it's a legacy. Founded on the principles of authenticity and purity, we bring the timeless recipes of our grandmothers' kitchens to your doorstep." },
      heroImage: { type: String, default: "https://images.pexels.com/photos/4134783/pexels-photo-4134783.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" },
      heroQuote: { type: String, default: "\"The secret ingredient is always love and a pinch of tradition.\"" },
      storyTitle: { type: String, default: "Crafting Memories,\nOne Batch at a Time." },
      storyDescription: { type: String, default: "We don't just sell food; we serve the same love and purity that defined the heritage of our family kitchens." },
      journeyTitle: { type: String, default: "From Our Family To Yours." },
      journeyDescription: { type: String, default: "Sai Nandhini started as a small kitchen experiment by a family of food enthusiasts who couldn't find the authentic taste of home in store-bought products. Today, we've grown into a community of thousands who share the same love for traditional South Indian delicacies." },
      journeyImage1: { type: String, default: "https://images.pexels.com/photos/674483/pexels-photo-674483.jpeg?auto=compress&cs=tinysrgb&w=800" },
      journeyImage2: { type: String, default: "https://images.pexels.com/photos/1055271/pexels-photo-1055271.jpeg?auto=compress&cs=tinysrgb&w=800" },
      happyCustomers: { type: String, default: "10k+" },
      secretRecipes: { type: String, default: "50+" },
    },
    ourStory: {
      title: { type: String, default: "Bringing the Authentic Taste of Madurai to Your Table." },
      highlightWord: { type: String, default: "Taste of Madurai" },
      description: { type: String, default: "What started as a small family kitchen has grown into Madurai's most loved destination for premium sweets and savories. At Sai Nandhini, we don't just bake; we craft memories using traditional wood-fired techniques and locally sourced, pure ingredients." },
      image: { type: String, default: "https://images.pexels.com/photos/3983674/pexels-photo-3983674.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" },
      yearsExcellence: { type: String, default: "25+" },
      bullets: [{ type: String, default: ["100% Natural Ingredients, No Preservatives", "Traditional Wood-Fired Baking Methods", "Daily Fresh Batches, Made with Love"] }]
    },
    trackingCodes: {
      headCode: { type: String, default: "" },  // Code injected inside <head>
      bodyStartCode: { type: String, default: "" },  // Code injected after <body>
    },
    whyChooseUs: {
      title: { type: String, default: "No Shortcuts.\nNo Compromises." },
      highlightWord: { type: String, default: "Compromises." },
      description: { type: String, default: "Every product we make carries a promise — pure, authentic, and crafted the traditional way." },
      image: { type: String, default: "https://images.pexels.com/photos/4686958/pexels-photo-4686958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" },
      badge1Value: { type: String, default: "25+" },
      badge1Label: { type: String, default: "Years of Heritage" },
      badge2Value: { type: String, default: "10K+" },
      badge2Label: { type: String, default: "Happy Customers" },
      features: {
        type: [{ title: String, desc: String }],
        default: [
          { title: "Traditional Recipes", desc: "Heritage bakes refined over 25 years. Our recipes are family heirlooms — not from a lab or an algorithm." },
          { title: "Premium Ingredients", desc: "Stone-ground whole wheat, native millets, and farm-sourced jaggery. You'll taste the real difference." },
          { title: "Wood-Fired Freshness", desc: "Baked in traditional wood-fired ovens every morning. From our kitchen to your table in hours, not days." }
        ]
      }
    },
  },
  {
    timestamps: true,
  },
);

const Settings = models.Settings || model("Settings", SettingsSchema);

export default Settings;
