import mongoose, { Schema, model, models } from "mongoose";

const SubCategorySchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    parentCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    description: { type: String },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

SubCategorySchema.index({ slug: 1, parentCategory: 1 }, { unique: true });

const SubCategory = models.SubCategory || model("SubCategory", SubCategorySchema);

export default SubCategory;
