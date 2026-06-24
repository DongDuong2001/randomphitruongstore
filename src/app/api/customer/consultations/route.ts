import { err, handlePrismaError, ok } from "@/lib/api-response";
import { isMissingCustomerSupabaseUserIdColumn } from "@/lib/customer-account";
import { getPrisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return err("Unauthorized", 401);
  }

  try {
    let customerId: string | null = null;
    try {
      const customer = await getPrisma().customer.findFirst({
        where: { supabaseUserId: user.id },
        select: { id: true }
      });
      customerId = customer?.id ?? null;
    } catch (error) {
      if (!isMissingCustomerSupabaseUserIdColumn(error)) {
        throw error;
      }
    }

    if (!customerId) {
      return ok({ inquiries: [] });
    }

    const inquiries = await getPrisma().productInquiry.findMany({
      where: { customerId },
      include: {
        product: {
          select: { nameVi: true, nameEn: true, slug: true }
        },
        images: true
      },
      orderBy: { createdAt: "desc" }
    });

    return ok({ inquiries });
  } catch (error) {
    return handlePrismaError(error);
  }
}
