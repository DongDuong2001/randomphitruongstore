import { z } from "zod";
import { err, ok, zodDetails } from "@/lib/api-response";
import { getPrisma } from "@/lib/prisma";
import { rateLimitPolicies, rateLimitRequest } from "@/lib/rate-limit";
import { createUploadIntent } from "@/lib/upload-intent";

const uploadIntentSchema = z.object({
  purpose: z.literal("PRODUCT_INQUIRY_IMAGE")
});

export async function POST(request: Request) {
  const limited = await rateLimitRequest(request, rateLimitPolicies.uploadIp);
  if (limited) return limited;

  const parsed = uploadIntentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid upload intent", 400, zodDetails(parsed.error));
  }

  const intent = await createUploadIntent({
    prisma: getPrisma(),
    purpose: parsed.data.purpose
  });

  return ok(intent, 201);
}
