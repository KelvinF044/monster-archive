import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getSessionClaims = cache(async () => {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims.sub !== "string") return null;

  const { data: enabled, error: accountError } = await supabase.rpc("community_account_enabled");
  return !accountError && enabled === true ? data.claims : null;
});

export const getAccount = cache(async () => {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const supabase = await createClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", claims.sub)
    .eq("is_active", true)
    .maybeSingle();

  if (admin) return { claims, role: "admin" as const };

  const { data: moderator } = await supabase
    .from("community_moderators")
    .select("user_id")
    .eq("user_id", claims.sub)
    .eq("is_active", true)
    .maybeSingle();

  return { claims, role: moderator ? "moderator" as const : "member" as const };
});
