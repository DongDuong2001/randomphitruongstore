import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { rateLimitPolicies, rateLimitRequest } from "@/lib/rate-limit";
import {
  consumeUploadIntent,
  type UploadIntentPurpose
} from "@/lib/upload-intent";
import {
  getUploadStorage,
  logUploadFailure,
  UploadValidationError,
  validateImageUpload
} from "@/lib/upload";

export async function POST(request: Request) {
  const limited = await rateLimitRequest(request, rateLimitPolicies.uploadIp);
  if (limited) return limited;

  const data = await request.formData();
  const file = data.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  const purpose = String(data.get("purpose") ?? "PRODUCT_INQUIRY_IMAGE");
  const isAdminUpload = await isAdminAuthenticated();
  if (purpose !== "PRODUCT_INQUIRY_IMAGE" && purpose !== "ADMIN_PRODUCT_IMAGE") {
    return NextResponse.json({ error: "Invalid upload purpose" }, { status: 400 });
  }

  if (!isAdminUpload) {
    const intentToken = String(data.get("intentToken") ?? "");
    const validIntent = await consumeUploadIntent({
      prisma: getPrisma(),
      token: intentToken,
      purpose: purpose as UploadIntentPurpose
    });
    if (!validIntent) {
      return NextResponse.json({ error: "Invalid upload intent" }, { status: 403 });
    }
  }

  try {
    const upload = await validateImageUpload(file);
    const url = await getUploadStorage().save(upload);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (!(error instanceof UploadValidationError)) {
      const requestId = requestIdFromRequest(request);
      logUploadFailure({
        error,
        operation: "upload.save",
        requestId
      });
      const response = NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      );
      response.headers.set("X-Request-Id", requestId);
      return response;
    }

    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
}

function requestIdFromRequest(request: Request) {
  const supplied = request.headers.get("x-request-id")?.trim();
  if (supplied && /^[A-Za-z0-9._:-]{1,80}$/.test(supplied)) {
    return supplied;
  }

  return randomUUID();
}
