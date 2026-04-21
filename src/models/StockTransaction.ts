import mongoose, { Schema, model, models } from "mongoose";

const StockTransactionSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true }, // Snapshot of name for history
    variantSku: { type: String }, // Optional, to identify specific variant if needed (e.g. "500g")
    type: {
        type: String,
        enum: ['Purchase', 'Adjustment', 'Sale', 'Return', 'Opening'],
        required: true
    },
    quantity: { type: Number, required: true }, // Positive for add, Negative for remove
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String }, // For adjustments
    reference: { type: String }, // E.g., PO Number, Order ID
    costPerUnit: { type: Number }, // For purchases
    supplier: { type: String }, // For purchases
    date: { type: Date, default: Date.now },
}, {
    timestamps: true
});

const StockTransaction = models.StockTransaction || model("StockTransaction", StockTransactionSchema);

export default StockTransaction;
