import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { orderRequestInputSchema } from "@/lib/validations";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await getPrisma().orderRequest.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const parsed = orderRequestInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const orderRequest = await getPrisma().orderRequest.create({
    data: {
      ...parsed.data,
      note: parsed.data.note || null
    }
  });
  return NextResponse.json(orderRequest, { status: 201 });
}
