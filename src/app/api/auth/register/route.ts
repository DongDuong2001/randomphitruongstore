import { err, ok, zodDetails } from "@/lib/api-response";
import { registrationClientResult } from "@/lib/auth-registration";
import {
  rateLimitIdentifier,
  rateLimitPolicies,
  rateLimitRequest
} from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { registerInputSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const ipLimit = await rateLimitRequest(request, rateLimitPolicies.registrationIp);
  if (ipLimit) return ipLimit;

  const parsed = registerInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid registration data", 400, zodDetails(parsed.error));
  }

  const accountLimit = await rateLimitIdentifier({
    policy: rateLimitPolicies.registrationAccount,
    identifier: parsed.data.email.trim().toLowerCase()
  });
  if (accountLimit) return accountLimit;

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName ?? ""
      }
    }
  });

  if (error) {
    console.warn("[Auth Registration]", {
      message: error.message,
      status: error.status
    });
  }

  const result = registrationClientResult({
    user: data.user,
    error
  });

  return ok(result.body, result.status);
}
