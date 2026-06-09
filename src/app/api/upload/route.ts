import { NextResponse } from "next/server";
import { getUploadStorage } from "@/lib/upload";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const data = await request.formData();
  const file = data.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG and WebP images are supported" },
      { status: 415 }
    );
  }
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "Image must be 5 MB or smaller" },
      { status: 413 }
    );
  }

  const url = await getUploadStorage().save(file);
  return NextResponse.json({ url }, { status: 201 });
}
