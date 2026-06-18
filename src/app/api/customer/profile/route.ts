import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { isMissingCustomerEmailColumn, normalizeEmail } from "@/lib/customer-account";
import { getPrisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = normalizeEmail(user?.email);

  if (!user || !email) {
    return err("Unauthorized", 401);
  }

  try {
    const customer = await getPrisma().customer.findFirst({
      where: { email },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        address: true,
        province: true,
        district: true,
        ward: true,
        zaloPhone: true,
        instagramHandle: true,
        preferredLanguage: true,
        createdAt: true
      }
    });

    if (!customer) {
      return ok(authProfileFallback(user.id, email, user.user_metadata?.full_name));
    }

    return ok(customer);
  } catch (error) {
    if (isMissingCustomerEmailColumn(error)) {
      return ok(authProfileFallback(user.id, email, user.user_metadata?.full_name));
    }
    return handlePrismaError(error);
  }
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = normalizeEmail(user?.email);

  if (!user || !email) {
    return err("Unauthorized", 401);
  }

  const parsed = profileUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid profile data", 400, zodDetails(parsed.error));
  }

  try {
    const customer = await getPrisma().customer.findFirst({
      where: { email },
      orderBy: { updatedAt: "desc" },
      select: { id: true }
    });

    if (!customer) {
      return err("Complete checkout details before saving a profile", 409);
    }

    const updated = await getPrisma().customer.update({
      where: { id: customer.id },
      data: parsed.data,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        address: true,
        province: true,
        district: true,
        ward: true,
        zaloPhone: true,
        instagramHandle: true,
        preferredLanguage: true
      }
    });

    return ok(updated);
  } catch (error) {
    if (isMissingCustomerEmailColumn(error)) {
      return err("Customer profile storage is not migrated", 503);
    }
    return handlePrismaError(error);
  }
}

function authProfileFallback(id: string, email: string, fullName?: unknown) {
  const displayName = typeof fullName === "string" && fullName.trim()
    ? fullName.trim()
    : email.split("@")[0];

  return {
    id,
    fullName: displayName,
    phone: "",
    email,
    address: "",
    province: "",
    district: "",
    ward: "",
    zaloPhone: null,
    instagramHandle: null,
    preferredLanguage: "vi",
    createdAt: new Date()
  };
}
