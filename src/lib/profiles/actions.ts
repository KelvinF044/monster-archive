"use server";

import { revalidatePath } from "next/cache";
import { getSessionClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { themeStyles, validHandle } from "./model";

export type ProfileState = {
  result?: "saved" | "taken" | "invalid" | "unavailable";
};

export async function saveProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  if (!await getSessionClaims()) return { result: "unavailable" };

  const field = (name: string) => String(form.get(name) ?? "").trim();
  const handle = field("handle").replace(/^@/, "").toLowerCase();
  const displayName = field("displayName");
  const bio = field("bio");
  const theme = field("theme");
  const avatar = field("avatarMember");
  const bias = field("bias");
  const era = field("era");

  const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
  if (
    !validHandle(handle) || !displayName || displayName.length > 40 || bio.length > 280
    || !Object.hasOwn(themeStyles, theme) || [avatar, bias, era].some((id) => id && !uuid.test(id))
  ) return { result: "invalid" };

  const db = await createClient();
  const { error } = await db.rpc("save_community_profile", {
    profile_handle: handle,
    profile_display_name: displayName,
    profile_bio: bio,
    profile_avatar_member_id: avatar || null,
    profile_bias_member_id: bias || null,
    profile_favorite_era_id: era || null,
    profile_theme: theme,
    profile_is_public: form.get("visibility") === "public",
    profile_share_favorites: form.get("shareFavorites") === "on",
    profile_share_history: form.get("shareHistory") === "on",
  });

  if (error?.code === "23505") return { result: "taken" };
  if (error?.code === "23514" || error?.code === "23503") return { result: "invalid" };
  if (error) return { result: "unavailable" };

  revalidatePath("/account");
  return { result: "saved" };
}
