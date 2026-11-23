import { createClient } from "@/lib/supabase/server";

export async function requireActiveAdmin() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string" || !userId) {
    return null;
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !admin) {
    return null;
  }

  return { supabase, userId };
}
