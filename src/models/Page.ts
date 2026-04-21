import mongoose from "mongoose";

const PageSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true, // e.g., 'terms-of-service', 'privacy-policy'
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true, // Can store HTML or Markdown
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Page || mongoose.model("Page", PageSchema);
