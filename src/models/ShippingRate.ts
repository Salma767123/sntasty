import mongoose, { Schema, model, models } from "mongoose";

// Force drop the old model if it exists with old schema
if (models.ShippingRate) {
  delete models.ShippingRate;
}

const WeightSlabSchema = new Schema(
  {
    upToGrams: { type: Number, required: true }, // upper weight bound for this slab, e.g. 500 = up to ½kg
    rate: { type: Number, required: true, default: 0 }, // charge for this slab, in currency
  },
  { _id: false },
);

const ShippingRateSchema = new Schema(
  {
    location: {
      type: String,
      required: true,
      unique: true
    },
    // Legacy flat rate — used only as a fallback when weightSlabs is empty.
    rate: { type: Number, default: 0 },
    // Weight-based slabs (sorted ascending by upToGrams). Preferred.
    weightSlabs: { type: [WeightSlabSchema], default: [] },
    // Charge added per extra ½kg (500g) beyond the highest slab. 0 = cap at top slab rate.
    extraPerHalfKgRate: { type: Number, default: 0 },
    estimatedDelivery: { type: String, required: true }, // e.g., "2 - 3 working days"
  },
  {
    timestamps: true,
  },
);

const ShippingRate = model("ShippingRate", ShippingRateSchema);

export default ShippingRate;
