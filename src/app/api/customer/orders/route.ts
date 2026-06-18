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
    const customers = await getPrisma().customer.findMany({
      where: { email },
      select: { id: true }
    });
    const customerIds = customers.map((customer) => customer.id);

    if (customerIds.length === 0) {
      return ok([]);
    }

    const orders = await getPrisma().order.findMany({
      where: { customerId: { in: customerIds } },
      include: {
        items: {
          include: {
            product: {
              select: { nameVi: true, nameEn: true, slug: true }
            }
          }
        },
        shippingAddress: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return ok(orders);
  } catch (error) {
    if (isMissingCustomerEmailColumn(error)) {
      return ok([]);
    }
    return handlePrismaError(error);
  }
}
