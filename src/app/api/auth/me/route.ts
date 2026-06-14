import { err, ok } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return err("Not authenticated", 401);
  }

  return ok({ user: data.user });
}
