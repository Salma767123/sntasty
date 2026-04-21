import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        uom: { type: String },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      state: { type: String },
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    discountPrice: { type: Number, required: true, default: 0.0 },
    couponCode: { type: String, default: null },
    discount: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Processing", "Shipping", "Delivered"],
      default: "Pending",
    },
    awbNumber: { type: String },
    courierName: { type: String },
    trackingLink: { type: String },
    estimatedDeliveryDate: { type: Date },
    shippingNotes: { type: String },
    invoiceEmailSent: { type: Boolean, default: false },
    invoiceEmailSentAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Indexes for fast queries on Atlas
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ isPaid: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ "shippingAddress.email": 1 });

const Order = models.Order || model("Order", OrderSchema);

export default Order;
