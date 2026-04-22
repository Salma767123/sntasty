import { z } from "zod";

// ── Reusable field validators ──

const emailField = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

const phoneField = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[+]?[\d\s()-]{7,15}$/, "Please enter a valid phone number");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be under 128 characters");

const nameField = z.string().min(1, "Name is required").max(100, "Name is too long");

const pincodeField = z
  .string()
  .min(1, "Pincode is required")
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits");

// ── Customer Forms ──

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
});

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  company: z.string().optional(),
  type: z.string().min(1, "Please select a type"),
  message: z.string().min(1, "Message is required").max(2000, "Message is too long"),
  date: z.string().optional(),
});

export const newsletterSchema = z.object({
  email: emailField,
});

export const corporateEnquirySchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  type: z.string().min(1, "Please select a type"),
  message: z.string().min(1, "Requirements are required").max(2000, "Message is too long"),
  date: z.string().optional(),
});

export const checkoutSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: emailField,
  phone: phoneField,
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  pincode: pincodeField,
  state: z.string().min(1, "Please select a state"),
});

export const passwordResetSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const orderTrackSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  email: emailField,
});

export const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(1, "Please enter a review comment").max(1000, "Review is too long"),
});

// ── Admin Forms ──

export const adminLoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Access key is required"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
});

export const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(30, "Code is too long"),
  discountType: z.enum(["percentage", "fixed", "free-delivery"]),
  discountValue: z.coerce.number().min(0, "Discount value must be 0 or more"),
  minOrderValue: z.coerce.number().min(0, "Minimum order must be 0 or more"),
  description: z.string().optional(),
});

export const heroSlideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image: z.string().min(1, "Image is required"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export const subCategorySchema = z.object({
  name: z.string().min(1, "Subcategory name is required"),
  parentId: z.string().min(1, "Please select a parent category"),
});

export const uomSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const shippingRateSchema = z.object({
  location: z.string().min(1, "Please select a location"),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
  estimatedDelivery: z.string().min(1, "Estimated delivery is required"),
});

export const inventoryPurchaseSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  cost: z.coerce.number().min(0.01, "Cost per unit is required"),
  supplier: z.string().min(1, "Supplier is required"),
});

export const inventoryAdjustmentSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().min(1, "Reason is required"),
});

export const legalPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export const settingsBrandSchema = z.object({
  shopName: z.string().min(1, "Store name is required"),
  contactEmail: z.union([emailField, z.literal("")]).optional(),
  contactPhone: z.string().optional(),
});

// ── Utility Types ──

export type FieldErrors = Record<string, string>;

export function validateForm<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: FieldErrors } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  // Scroll to first error field after React re-renders the error messages
  if (typeof window !== "undefined") {
    setTimeout(() => {
      const firstError = document.querySelector("[data-form-error]");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
  }

  return { success: false, errors };
}
