import mongoose, { Schema, model, models } from "mongoose";

const PasswordResetSchema = new Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-expire documents after token expires
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = models.PasswordReset || model("PasswordReset", PasswordResetSchema);

export default PasswordReset;
