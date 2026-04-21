import mongoose, { Schema, model, models } from "mongoose";

const HeroSlideSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleAccent: {
      type: String,
      trim: true,
      default: "",
    },
    tag: {
      type: String,
      trim: true,
      default: "Bestseller",
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // Cloudinary URL or public ID
      required: true,
      trim: true,
    },
    ctaText: {
      type: String,
      default: "Shop Now",
      trim: true,
    },
    ctaLink: {
      type: String,
      default: "/shop",
      trim: true,
    },
    badge1: {
      type: String,
      default: "100% Natural",
      trim: true,
    },
    badge2: {
      type: String,
      default: "Traditional Recipe",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

const HeroSlide = models.HeroSlide || model("HeroSlide", HeroSlideSchema);

export default HeroSlide;
