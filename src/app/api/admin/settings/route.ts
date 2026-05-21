import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { encryptPassword, decryptPassword } from "@/lib/encryption";
import { uploadToCloudinary } from "@/lib/cloudinary";
import Razorpay from "razorpay";
import { revalidateTag } from "next/cache";
import { revalidatePublicData, CACHE_KEYS } from "@/lib/cache";

const MASKED = "********";

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne();

    if (settings) {
      const masked = settings.toObject();

      // Migration: Convert old taxRate to taxRates array
      if (
        masked.taxRate !== undefined &&
        (!masked.taxRates || masked.taxRates.length === 0)
      ) {
        masked.taxRates = [
          {
            name: "GST",
            rate: masked.taxRate,
            isDefault: true,
          },
        ];
        // Update in database
        await Settings.findOneAndUpdate(
          {},
          {
            taxRates: masked.taxRates,
            $unset: { taxRate: "" },
          },
        );
      }

      if (masked.payment?.razorpayKeySecret)
        masked.payment.razorpayKeySecret = MASKED;
      if (masked.payment?.razorpayWebhookSecret)
        masked.payment.razorpayWebhookSecret = MASKED;
      if (masked.payment?.phonepeClientSecret)
        masked.payment.phonepeClientSecret = MASKED;
      if (masked.payment?.phonepeWebhookPassword)
        masked.payment.phonepeWebhookPassword = MASKED;
      if (masked.smtp?.password) masked.smtp.password = MASKED;
      if (masked.googleMyBusiness?.apiKey)
        masked.googleMyBusiness.apiKey = MASKED;
      return NextResponse.json(masked);
    }

    return NextResponse.json({});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type");
    let data;

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const rawData = formData.get("data") as string;
      data = JSON.parse(rawData);

      const logoFile = formData.get("logo") as File;
      const faviconFile = formData.get("favicon") as File;

      if (logoFile && logoFile instanceof File) {
        const buffer = Buffer.from(await logoFile.arrayBuffer());
        const base64Image = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
        const result = await uploadToCloudinary(
          base64Image,
          "sainandhini/brand",
        );
        data.logo = result.secure_url;
      }

      if (faviconFile && faviconFile instanceof File) {
        const buffer = Buffer.from(await faviconFile.arrayBuffer());
        const base64Image = `data:${faviconFile.type};base64,${buffer.toString("base64")}`;
        const result = await uploadToCloudinary(
          base64Image,
          "sainandhini/brand",
        );
        data.favicon = result.secure_url;
      }
    } else {
      data = await req.json();
    }

    // Upload any base64 images to Cloudinary (prevent MB+ document bloat)
    if (data.logo && data.logo.startsWith("data:")) {
      const logoResult = await uploadToCloudinary(data.logo, "sainandhini/brand");
      data.logo = logoResult.secure_url;
    }
    if (data.favicon && data.favicon.startsWith("data:")) {
      const faviconResult = await uploadToCloudinary(data.favicon, "sainandhini/brand");
      data.favicon = faviconResult.secure_url;
    }
    if (data.seo?.ogImage && data.seo.ogImage.startsWith("data:")) {
      const ogResult = await uploadToCloudinary(data.seo.ogImage, "sainandhini/brand");
      data.seo.ogImage = ogResult.secure_url;
    }

    // Process About Us images
    if (data.aboutUs?.heroImage && data.aboutUs.heroImage.startsWith("data:")) {
      const heroResult = await uploadToCloudinary(data.aboutUs.heroImage, "sainandhini/about");
      data.aboutUs.heroImage = heroResult.secure_url;
    }
    if (data.aboutUs?.journeyImage1 && data.aboutUs.journeyImage1.startsWith("data:")) {
      const journey1Result = await uploadToCloudinary(data.aboutUs.journeyImage1, "sainandhini/about");
      data.aboutUs.journeyImage1 = journey1Result.secure_url;
    }
    if (data.aboutUs?.journeyImage2 && data.aboutUs.journeyImage2.startsWith("data:")) {
      const journey2Result = await uploadToCloudinary(data.aboutUs.journeyImage2, "sainandhini/about");
      data.aboutUs.journeyImage2 = journey2Result.secure_url;
    }
    // Process Our Story image
    if (data.ourStory?.image && data.ourStory.image.startsWith("data:")) {
      const storyResult = await uploadToCloudinary(data.ourStory.image, "sainandhini/cms");
      data.ourStory.image = storyResult.secure_url;
    }
    // Process Why Choose Us image
    if (data.whyChooseUs?.image && data.whyChooseUs.image.startsWith("data:")) {
      const whyResult = await uploadToCloudinary(data.whyChooseUs.image, "sainandhini/cms");
      data.whyChooseUs.image = whyResult.secure_url;
    }

    await connectDB();

    // Determine which tab triggered the save
    const saveContext = data._saveContext;
    delete data._saveContext;

    // Handle Sensitive fields
    const existing = await Settings.findOne();

    // Track if Razorpay credentials are actually being changed
    let razorpayCredentialsChanged = false;

    // --- Handle Payment Keys ---
    if (data.payment?.razorpayKeySecret) {
      if (data.payment.razorpayKeySecret === MASKED) {
        data.payment.razorpayKeySecret = existing?.payment?.razorpayKeySecret;
      } else {
        razorpayCredentialsChanged = true;
        data.payment.razorpayKeySecret = encryptPassword(
          data.payment.razorpayKeySecret,
        );
      }
    }

    if (data.payment?.razorpayWebhookSecret) {
      if (data.payment.razorpayWebhookSecret === MASKED) {
        data.payment.razorpayWebhookSecret =
          existing?.payment?.razorpayWebhookSecret;
      } else {
        data.payment.razorpayWebhookSecret = encryptPassword(
          data.payment.razorpayWebhookSecret,
        );
      }
    } else if (existing?.payment?.razorpayWebhookSecret) {
      data.payment = data.payment || {};
      data.payment.razorpayWebhookSecret = existing.payment.razorpayWebhookSecret;
    }

    // Preserve Razorpay Key Secret on empty (e.g., when saving from another tab)
    if (!data.payment?.razorpayKeySecret && existing?.payment?.razorpayKeySecret) {
      data.payment = data.payment || {};
      data.payment.razorpayKeySecret = existing.payment.razorpayKeySecret;
    }

    // --- Handle PhonePe Client Secret (V2 OAuth) ---
    if (data.payment?.phonepeClientSecret) {
      if (data.payment.phonepeClientSecret === MASKED) {
        data.payment.phonepeClientSecret = existing?.payment?.phonepeClientSecret;
      } else {
        data.payment.phonepeClientSecret = encryptPassword(
          data.payment.phonepeClientSecret,
        );
      }
    } else if (existing?.payment?.phonepeClientSecret) {
      // Preserve existing if not provided (prevents accidental wipe from other tabs)
      data.payment = data.payment || {};
      data.payment.phonepeClientSecret = existing.payment.phonepeClientSecret;
    }

    // --- Handle PhonePe Webhook Password (V2) ---
    if (data.payment?.phonepeWebhookPassword) {
      if (data.payment.phonepeWebhookPassword === MASKED) {
        data.payment.phonepeWebhookPassword = existing?.payment?.phonepeWebhookPassword;
      } else {
        data.payment.phonepeWebhookPassword = encryptPassword(
          data.payment.phonepeWebhookPassword,
        );
      }
    } else if (existing?.payment?.phonepeWebhookPassword) {
      data.payment = data.payment || {};
      data.payment.phonepeWebhookPassword = existing.payment.phonepeWebhookPassword;
    }

    // --- Deep-merge data.payment with existing.payment to prevent accidental wipes ---
    // Mongoose findOneAndUpdate({ }, { payment: {...} }) REPLACES the entire payment subdoc.
    // To prevent any field from being silently lost, we merge incoming data with existing,
    // treating empty/undefined/null as "no change" rather than "set to empty".
    if (existing?.payment) {
      const incomingPayment = data.payment || {};
      const merged: Record<string, any> = {};

      // Start from existing payment as the base — convert Mongoose subdoc to plain object
      const existingPayment =
        typeof (existing.payment as any).toObject === "function"
          ? (existing.payment as any).toObject()
          : { ...existing.payment };
      for (const [k, v] of Object.entries(existingPayment)) {
        merged[k] = v;
      }

      // Overlay incoming — but only non-empty values
      for (const [k, v] of Object.entries(incomingPayment)) {
        const isEmpty =
          v === undefined ||
          v === null ||
          (typeof v === "string" && v.trim() === "");
        if (!isEmpty) {
          merged[k] = v;
        }
      }

      data.payment = merged;
    }

    // --- Validate Razorpay Credentials (only when saving payment tab and credentials changed) ---
    if (
      saveContext === "payment" &&
      razorpayCredentialsChanged &&
      data.payment?.razorpayKeyId &&
      data.payment?.razorpayKeySecret
    ) {
      try {
        const testSecret = decryptPassword(data.payment.razorpayKeySecret);

        const instance = new Razorpay({
          key_id: data.payment.razorpayKeyId,
          key_secret: testSecret,
        });
        await (instance.orders as any).all({ count: 1 });
      } catch (rzpError: any) {
        return NextResponse.json(
          { error: "Invalid Razorpay credentials. Connection test failed." },
          { status: 400 },
        );
      }
    }

    // --- Validate PhonePe required fields & activeGateway consistency ---
    if (saveContext === "payment") {
      const ag = data.payment?.activeGateway || "razorpay";
      const phonepeRequired = ag === "phonepe" || ag === "both";
      const razorpayRequired = ag === "razorpay" || ag === "both";

      if (phonepeRequired) {
        const merchantId = data.payment?.phonepeMerchantId;
        const clientId = data.payment?.phonepeClientId;
        const clientSecret =
          data.payment?.phonepeClientSecret || existing?.payment?.phonepeClientSecret;
        if (!merchantId || !clientId || !clientSecret) {
          return NextResponse.json(
            {
              error:
                "PhonePe is selected as active gateway but Merchant ID, Client ID, or Client Secret is missing.",
            },
            { status: 400 },
          );
        }
        const env = data.payment?.phonepeEnv;
        if (env && env !== "UAT" && env !== "PROD") {
          return NextResponse.json(
            { error: "PhonePe Environment must be either UAT or PROD." },
            { status: 400 },
          );
        }
      }

      if (razorpayRequired) {
        const rzpKeyId = data.payment?.razorpayKeyId;
        const rzpSecret =
          data.payment?.razorpayKeySecret || existing?.payment?.razorpayKeySecret;
        if (!rzpKeyId || !rzpSecret) {
          return NextResponse.json(
            {
              error:
                "Razorpay is selected as active gateway but Key ID or Key Secret is missing.",
            },
            { status: 400 },
          );
        }
      }
    }

    // --- Handle SMTP password ---
    if (data.smtp?.password) {
      if (data.smtp.password === MASKED) {
        data.smtp.password = existing?.smtp?.password;
      } else {
        data.smtp.password = encryptPassword(data.smtp.password);
      }
    }

    // --- Handle Google My Business API Key ---
    if (data.googleMyBusiness?.apiKey) {
      if (data.googleMyBusiness.apiKey === MASKED) {
        data.googleMyBusiness.apiKey = existing?.googleMyBusiness?.apiKey;
      } else {
        data.googleMyBusiness.apiKey = encryptPassword(
          data.googleMyBusiness.apiKey,
        );
      }
    }

    // Safety net: never store base64 images in MongoDB
    if (data.logo && data.logo.startsWith("data:")) delete data.logo;
    if (data.favicon && data.favicon.startsWith("data:")) delete data.favicon;
    if (data.seo?.ogImage && data.seo.ogImage.startsWith("data:")) delete data.seo.ogImage;
    if (data.aboutUs?.heroImage && data.aboutUs.heroImage.startsWith("data:")) delete data.aboutUs.heroImage;
    if (data.aboutUs?.journeyImage1 && data.aboutUs.journeyImage1.startsWith("data:")) delete data.aboutUs.journeyImage1;
    if (data.aboutUs?.journeyImage2 && data.aboutUs.journeyImage2.startsWith("data:")) delete data.aboutUs.journeyImage2;
    if (data.ourStory?.image && data.ourStory.image.startsWith("data:")) delete data.ourStory.image;
    if (data.whyChooseUs?.image && data.whyChooseUs.image.startsWith("data:")) delete data.whyChooseUs.image;

    const settings = await Settings.findOneAndUpdate({}, data, {
      returnDocument: "after",
      upsert: true,
    });

    const response = settings.toObject();
    if (response.payment?.razorpayKeySecret)
      response.payment.razorpayKeySecret = MASKED;
    if (response.payment?.razorpayWebhookSecret)
      response.payment.razorpayWebhookSecret = MASKED;
    if (response.payment?.phonepeClientSecret)
      response.payment.phonepeClientSecret = MASKED;
    if (response.payment?.phonepeWebhookPassword)
      response.payment.phonepeWebhookPassword = MASKED;
    if (response.smtp?.password) response.smtp.password = MASKED;
    if (response.googleMyBusiness?.apiKey)
      response.googleMyBusiness.apiKey = MASKED;

    revalidatePublicData([CACHE_KEYS.SEO, CACHE_KEYS.NAVBAR, CACHE_KEYS.SETTINGS_PUBLIC]);
    revalidateTag("seo-settings", "default");
    revalidateTag("navbar-data", "default");
    revalidateTag("settings-public", "default");

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT method for updating settings
export async function PUT(req: Request) {
  return POST(req); // Reuse POST logic
}
