import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizeEmail } from "@/lib/customer-account";
import { getPrisma } from "@/lib/prisma";
import {
  createProductInquiryFromOrderRequest,
  listAdminProductInquiries
} from "@/lib/product-inquiry";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { orderRequestInputSchema } from "@/lib/validations";

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
  const parsed = orderRequestInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid request data", 400, zodDetails(parsed.error));
  }
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = normalizeEmail(user?.email);
    const orderRequest = await createProductInquiryFromOrderRequest({
      prisma: getPrisma(),
      input: parsed.data,
      userEmail: email
    });

    return ok(orderRequest, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}
