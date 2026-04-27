import mongoose from "mongoose";

const EnquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    type: {
        type: String,
        enum: ["General Inquiry", "Order Support", "Product Question", "Feedback", "Corporate Booking", "Event Catering", "Bulk Order", "Corporate Gifting", "Customizable Packs", "Personalized Branding", "Other"],
        default: "Other"
    },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ["New", "In Progress", "Completed"],
        default: "New"
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Enquiry || mongoose.model("Enquiry", EnquirySchema);
