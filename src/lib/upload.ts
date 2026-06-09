import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

export function getUploadStorage(): UploadStorage {
  const driver = process.env.UPLOAD_DRIVER ?? "local";
  if (driver !== "local") {
    throw new Error(`Unsupported upload driver: ${driver}`);
  }

  return new LocalUploadStorage();
}
