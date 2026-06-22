import { err, ok, zodDetails } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { loginInputSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const parsed = loginInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid credentials", 400, zodDetails(parsed.error));
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return err("Invalid email or password", 401);
  }

  // Note: Session duration ("Remember me") is configured in Supabase Dashboard
  // under Authentication > Settings > JWT expiry and Refresh token rotation.
  // The rememberMe field is accepted for future extensibility.

  return ok({ user: data.user });
}
