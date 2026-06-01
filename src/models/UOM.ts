import mongoose, { Schema, model, models } from "mongoose";

const UOMSchema = new Schema({
    name: { type: String, required: true }, // e.g. "500gms"
    code: { type: String, required: true, unique: true }, // e.g. "500g"
    weightInGrams: { type: Number, default: 0 }, // physical weight for shipping calc, e.g. 500
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

const UOM = models.UOM || model("UOM", UOMSchema);

export default UOM;
