import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
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
    const orderRequest = await getPrisma().orderRequest.create({
      data: {
        ...parsed.data,
        note: parsed.data.note || null
      }
    });
    return ok(orderRequest, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}
