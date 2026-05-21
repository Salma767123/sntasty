import crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.BETTER_AUTH_SECRET || "default-encryption-key-change-this";
const ALGORITHM = "aes-256-cbc";

// Already-encrypted values have format "32-hex-chars:hex-ciphertext"
const ENCRYPTED_PATTERN = /^[0-9a-f]{32}:[0-9a-f]+$/i;

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && ENCRYPTED_PATTERN.test(value);
}

export function encryptPassword(password: string): string {
  try {
    // Safeguard: never double-encrypt an already-encrypted value
    if (isEncrypted(password)) {
      return password;
    }
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return password;
  }
}

export function decryptPassword(encryptedPassword: string): string {
  try {
    if (!encryptedPassword || !encryptedPassword.includes(":")) {
      return encryptedPassword;
    }
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const parts = encryptedPassword.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}
