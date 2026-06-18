import { err, handlePrismaError, ok } from "@/lib/api-response";
import { isMissingCustomerEmailColumn, normalizeEmail } from "@/lib/customer-account";
import { getPrisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = normalizeEmail(user?.email);

  if (!user || !email) {
    return err("Unauthorized", 401);
  }

  try {
    let customerIds: string[] = [];
    try {
      const customers = await getPrisma().customer.findMany({
        where: { email },
        select: { id: true }
      });
      customerIds = customers.map((customer) => customer.id);
    } catch (error) {
      if (!isMissingCustomerEmailColumn(error)) {
        throw error;
      }
    }

    const inquiries = await getPrisma().productInquiry.findMany({
      where: {
        OR: [
          ...(customerIds.length > 0 ? [{ customerId: { in: customerIds } }] : []),
          { email }
        ]
      },
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
