import mongoose, { Schema, model, models } from "mongoose";

// Force drop the old model if it exists with old schema
if (models.ShippingRate) {
  delete models.ShippingRate;
}

const ShippingRateSchema = new Schema(
  {
    location: { 
      type: String, 
      required: true,
      enum: ["Tamil Nadu", "Puducherry", "Other States"],
      unique: true
    },
    rate: { type: Number, required: true, default: 0 }, // in currency
    estimatedDelivery: { type: String, required: true }, // e.g., "2 - 3 working days"
  },
  {
    timestamps: true,
  },
);

const ShippingRate = model("ShippingRate", ShippingRateSchema);

export default ShippingRate;
