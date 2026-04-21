import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  analytics: false, // Disable URL analytics to avoid sdk_semver error in Next.js bundler
});

export default cloudinary;

/* ────────────────────────────────────────────────────────────
   Helper utilities — ported from the reference repo pattern
   ──────────────────────────────────────────────────────────── */

/**
 * Extracts the Cloudinary public ID from a full URL.
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  try {
    const urlWithoutQuery = url.split("?")[0];
    const parts = urlWithoutQuery.split("/upload/");
    if (parts.length < 2) return null;

    const afterUpload = parts[1];
    const pathParts = afterUpload.split("/");

    // Find the LAST version segment (e.g. "v123456789")
    let versionIndex = -1;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i].match(/^v\d+$/)) {
        versionIndex = i;
        break;
      }
    }

    const startIndex = versionIndex !== -1 ? versionIndex + 1 : 0;
    const publicIdWithExt = pathParts.slice(startIndex).join("/");
    const publicId = publicIdWithExt.split(".")[0];

    return publicId;
  } catch {
    return null;
  }
};

/**
 * Generates a secure Cloudinary URL from a public ID.
 */
export const getUrlFromPublicId = (
  publicId: string,
  customOptions: Record<string, any> = {},
): string | null => {
  if (!publicId) return null;
  if (publicId.startsWith("http")) return publicId;

  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
    quality: "auto",
    fetch_format: "auto",
    ...customOptions,
  });
};

/**
 * Uploads a base64 image or file path to Cloudinary.
 */
export const uploadToCloudinary = async (
  file: string,
  folder = "sainandhini/images",
  customPublicId: string | null = null,
) => {
  const options: Record<string, any> = {
    folder,
    resource_type: "auto",
  };

  if (customPublicId) {
    options.public_id = customPublicId;
  }

  const result = await cloudinary.uploader.upload(file, options);
  const cleanPublicId = result.public_id
    ? result.public_id.split("?")[0]
    : result.public_id;

  return {
    secure_url: result.secure_url,
    public_id: cleanPublicId,
  };
};

/**
 * Deletes an asset from Cloudinary using its URL or public ID.
 */
export const deleteFromCloudinary = async (identifier: string) => {
  try {
    const publicId = identifier.startsWith("http")
      ? getPublicIdFromUrl(identifier)
      : identifier;

    if (publicId && !publicId.startsWith("/images/")) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
  }
};
