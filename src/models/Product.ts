import mongoose, { Schema, model, models } from "mongoose";

// Import SubCategory to ensure it's registered before Product model uses it
import "./SubCategory";

const ProductSchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    subCategory: { type: Schema.Types.ObjectId, ref: "SubCategory" },
    variants: [{
        uom: { type: String, required: true }, // Keeping as string for flexibility or could be ref
        price: { type: Number, required: true },
        stock: { type: Number, default: 0 }
    }],
    images: [{ type: String }],
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    badge: { type: String },
    uom: { type: String, default: "pcs" }, // Legacy support
    seo: {
        metaTitle: { type: String },
        metaDescription: { type: String },
        keywords: { type: String },
    },
}, {
    timestamps: true,
});

// Indexes for fast queries on Atlas
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isFeatured: 1 });

const Product = models.Product || model("Product", ProductSchema);

export default Product;
