import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizeEmail } from "@/lib/customer-account";
import { getPrisma } from "@/lib/prisma";
import { rateLimitPolicies, rateLimitRequest } from "@/lib/rate-limit";
import {
  createProductInquiry,
  listAdminProductInquiries
} from "@/lib/product-inquiry";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { productInquiryInputSchema } from "@/lib/validations";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }
  try {
    const requests = await listAdminProductInquiries(getPrisma());
    return ok(requests);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: Request) {
  const limited = await rateLimitRequest(request, rateLimitPolicies.inquiryIp);
  if (limited) return limited;

  const parsed = productInquiryInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid request data", 400, zodDetails(parsed.error));
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = normalizeEmail(user?.email);
    const inquiry = await createProductInquiry({
      prisma: getPrisma(),
      input: parsed.data,
      userEmail: email,
      supabaseUserId: user?.id
    });

    return ok(inquiry, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}
