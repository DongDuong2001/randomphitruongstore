import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { normalizeEmail } from "@/lib/customer-account";
import { getPrisma } from "@/lib/prisma";
import { rateLimitPolicies, rateLimitRequest } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const internationalRequestSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z
    .string()
    .trim()
    .min(9, "Phone number is too short")
    .max(20, "Phone number is too long"),
  socialContact: z.string().trim().min(2),
  productName: z.string().trim().min(2),
  region: z.enum(["KOREA", "TAIWAN", "JAPAN"]),
  desiredSize: z.string().trim().min(1),
  desiredColor: z.string().trim().min(1),
  customsNote: z.string().trim().optional(),
  note: z.string().trim().max(1000).optional()
});

/**
 * POST /api/international-requests
 *
 * Stores international shipping consultation requests as ProductInquiry records
 * so they appear in the admin "Order requests" panel alongside inspiration
 * sourcing requests. The client then opens a pre-filled Zalo message for the
 * actual conversation.
 */
export async function POST(request: Request) {
  const limited = await rateLimitRequest(
    request,
    rateLimitPolicies.internationalRequestIp
  );
  if (limited) return limited;

  const parsed = internationalRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid request data", 400, zodDetails(parsed.error));
  }

  const input = parsed.data;

  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = normalizeEmail(user?.email);

    // Build a customer message that captures the international-specific details.
    const customerMessage = [
      `[International order — ${input.region}]`,
      `Product: ${input.productName}`,
      input.customsNote ? `Customs info: ${input.customsNote}` : null,
      input.note ? `Note: ${input.note}` : null
    ]
      .filter(Boolean)
      .join("\n");

    // Find or create the customer record so the inquiry is linked to an account
    // when the user is signed in.
    let customerId: string | null = null;
    if (user?.id) {
      const customer = await getPrisma().customer.findFirst({
        where: { supabaseUserId: user.id },
        select: { id: true }
      });
      customerId = customer?.id ?? null;
    }

    const inquiry = await getPrisma().productInquiry.create({
      data: {
        customerId,
        fullName: input.fullName,
        phone: input.phone,
        ...(email ? { email } : {}),
        instagramHandle: input.socialContact,
        // Store the product name and region in externalProductUrl as a
        // structured identifier so admins can see the context.
        externalProductUrl: `international:${input.region}:${input.productName}`,
        customerMessage,
        preferredSize: input.desiredSize,
        preferredColor: input.desiredColor,
        sourceChannel: "WEBSITE"
      },
      select: { id: true }
    });

    return ok({ id: inquiry.id }, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}
