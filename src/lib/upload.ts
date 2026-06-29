import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const maxImageSize = 5 * 1024 * 1024;

export type ValidatedImageUpload = {
  bytes: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

export interface UploadStorage {
  save(upload: ValidatedImageUpload): Promise<string>;
}

export type UploadFailureLogInput = {
  error: unknown;
  operation: string;
  requestId: string;
};

export type UploadFailureLogMetadata = {
  operation: string;
  requestId: string;
  errorCode: string;
};

export class UploadValidationError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export async function validateImageUpload(file: File): Promise<ValidatedImageUpload> {
  if (file.size > maxImageSize) {
    throw new UploadValidationError("Image must be 5 MB or smaller", 413);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected) {
    throw new UploadValidationError(
      "Only JPG, PNG and WebP images are supported",
      415
    );
  }

  return { bytes, ...detected };
}

function detectImageType(bytes: Buffer): Omit<ValidatedImageUpload, "bytes"> | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mimeType: "image/png", extension: "png" };
  }

  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }

  return null;
}

class LocalUploadStorage implements UploadStorage {
  async save(upload: ValidatedImageUpload) {
    const fileName = `${Date.now()}-${randomUUID()}.${upload.extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), upload.bytes);
    return `/uploads/${fileName}`;
  }
}

class SupabaseUploadStorage implements UploadStorage {
  async save(upload: ValidatedImageUpload) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase upload driver"
      );
    }

    const fileName = `${Date.now()}-${randomUUID()}.${upload.extension}`;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.storage
      .from("uploads")
      .upload(fileName, upload.bytes, { contentType: upload.mimeType });

    if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
    return data.publicUrl;
  }
}

class CloudinaryUploadStorage implements UploadStorage {
  async save(upload: ValidatedImageUpload) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required for Cloudinary upload driver"
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `timestamp=${timestamp}${apiSecret}`;
    
    const { createHash } = await import("node:crypto");
    const signature = createHash("sha1").update(stringToSign).digest("hex");

    const formData = new FormData();
    const base64Data = upload.bytes.toString("base64");
    const dataUri = `data:${upload.mimeType};base64,${base64Data}`;
    
    formData.append("file", dataUri);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary Storage upload failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.secure_url;
  }
}

export function getUploadStorage(): UploadStorage {
  const driver = process.env.UPLOAD_DRIVER ?? "local";
  if (driver === "supabase") {
    return new SupabaseUploadStorage();
  }
  if (driver === "cloudinary") {
    return new CloudinaryUploadStorage();
  }
  if (driver === "local") {
    return new LocalUploadStorage();
  }
  throw new Error(`Unsupported upload driver: ${driver}`);
}

export function logUploadFailure(input: UploadFailureLogInput) {
  console.error("[Upload] Upload failed", uploadFailureLogMetadata(input));
}

export function uploadFailureLogMetadata({
  error,
  operation,
  requestId
}: UploadFailureLogInput): UploadFailureLogMetadata {
  return {
    operation: safeLogIdentifier(operation) ?? "upload.unknown",
    requestId: safeLogIdentifier(requestId) ?? "unknown",
    errorCode: uploadFailureErrorCode(error)
  };
}

function uploadFailureErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return "UPLOAD_STORAGE_ERROR";
  }

  const errorLike = error as { code?: unknown; status?: unknown };
  const code = safeLogIdentifier(errorLike.code);
  if (code) return code;

  if (typeof errorLike.status === "number" && Number.isFinite(errorLike.status)) {
    return `HTTP_${errorLike.status}`;
  }

  return "UPLOAD_STORAGE_ERROR";
}

function safeLogIdentifier(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("://")) return null;
  return /^[A-Za-z0-9._:-]{1,80}$/.test(trimmed) ? trimmed : null;
}
