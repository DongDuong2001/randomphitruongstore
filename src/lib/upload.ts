import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export interface UploadStorage {
  save(file: File): Promise<string>;
}

class LocalUploadStorage implements UploadStorage {
  async save(file: File) {
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };
    const extension = extensions[file.type] ?? "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(
      path.join(uploadDirectory, fileName),
      Buffer.from(await file.arrayBuffer())
    );
    return `/uploads/${fileName}`;
  }
}

class SupabaseUploadStorage implements UploadStorage {
  async save(file: File) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase upload driver");
    }

    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };
    const extension = extensions[file.type] ?? "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.storage
      .from("uploads")
      .upload(fileName, file, { contentType: file.type });

    if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
    return data.publicUrl;
  }
}

export function getUploadStorage(): UploadStorage {
  const driver = process.env.UPLOAD_DRIVER ?? "local";
  if (driver === "supabase") {
    return new SupabaseUploadStorage();
  }
  if (driver === "local") {
    return new LocalUploadStorage();
  }
  throw new Error(`Unsupported upload driver: ${driver}`);
}
