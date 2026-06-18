import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isMissingCustomerEmailColumn, normalizeEmail } from "@/lib/customer-account";
import { getPrisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { orderRequestInputSchema } from "@/lib/validations";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }
  try {
    const requests = await getPrisma().orderRequest.findMany({
      orderBy: { createdAt: "desc" }
    });
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
    let customerId: string | null = null;

    if (email) {
      try {
        const customer = await getPrisma().customer.findFirst({
          where: { email },
          orderBy: { updatedAt: "desc" },
          select: { id: true }
        });
        customerId = customer?.id ?? null;
      } catch (error) {
        if (!isMissingCustomerEmailColumn(error)) {
          throw error;
        }
      }
    }

    const orderRequest = await getPrisma().orderRequest.create({
      data: {
        ...parsed.data,
        note: parsed.data.note || null
      }
    });

    if (email) {
      await getPrisma().productInquiry.create({
        data: {
          customerId,
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          email,
          instagramHandle: parsed.data.socialContact,
          externalProductUrl: parsed.data.inspirationUrl,
          customerMessage: parsed.data.note || null,
          preferredSize: parsed.data.desiredSize,
          preferredColor: parsed.data.desiredColor,
          images: {
            create: {
              imageUrl: parsed.data.inspirationUrl
            }
          }
        }
      });
    }

    return ok(orderRequest, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}
