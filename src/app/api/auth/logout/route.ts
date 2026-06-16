import { err, ok } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return err("Failed to sign out", 500);
  }

  return ok({ ok: true });
}
