import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { orderRequestStatusSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = orderRequestStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const { id } = await context.params;
  const orderRequest = await getPrisma().orderRequest.update({
    where: { id },
    data: { status: parsed.data.status }
  });
  return NextResponse.json(orderRequest);
}
