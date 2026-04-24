import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["customer", "admin", "staff", "user"],
      default: "customer",
    },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      pincode: String,
      state: String,
    },
    savedAddresses: [
      {
        label: { type: String, default: "Home" },
        fullName: { type: String, required: true },
        email: { type: String },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        state: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
    collection: "user",
  },
);

UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ phone: 1 });

if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}
const User = model("User", UserSchema);

export default User;
