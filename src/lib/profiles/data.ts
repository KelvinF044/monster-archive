import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Sharing } from "./model";

type ProfileDb = Awaited<ReturnType<typeof createClient>>;

const fields = "handle,display_name,bio,avatar_member_id,bias_member_id,favorite_era_id,theme,is_public";

async function getCatalog(db: ProfileDb) {
  const [members, eras] = await Promise.all([
    db.from("members").select("id,name,image_url").eq("is_active", true).order("display_order"),
    db.from("watch_eras").select("id,name").eq("is_active", true).order("display_order").order("name"),
  ]);

  if (members.error || eras.error) return null;
  return { members: members.data, eras: eras.data };
}

export type ProfileCatalog = NonNullable<Awaited<ReturnType<typeof getCatalog>>>;

export async function getOwnProfile(userId: string) {
  const db = await createClient();
  const [profile, sharing, catalog] = await Promise.all([
    db.from("community_profiles").select(fields).eq("user_id", userId).maybeSingle<Profile>(),
    db.from("community_profile_settings")
      .select("share_favorites,share_history")
      .eq("user_id", userId).maybeSingle<Sharing>(),
    getCatalog(db),
  ]);

  if (profile.error || sharing.error || !catalog) return null;
  return { profile: profile.data, sharing: sharing.data, catalog };
}

export async function getPublicProfile(handle: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Public profile database unavailable");

  // Resolve the page with the same permissions for owners, staff and visitors.
  const db = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  const { data: profile, error } = await db.from("community_profiles")
    .select(fields).eq("handle", handle).maybeSingle<Profile>();
  if (error) throw new Error("Unable to read public profile");
  if (!profile) return null;

  const catalog = await getCatalog(db);
  if (!catalog) throw new Error("Unable to read profile catalog");
  return { profile, catalog };
}
