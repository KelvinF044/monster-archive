"use server";

import { revalidatePath } from "next/cache";
import { getAccount } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { profilesHref, type ProfileEditState } from "./model";

export async function updateCommunityProfile(_: ProfileEditState, form: FormData): Promise<ProfileEditState> {
  if ((await getAccount())?.role !== "admin") return { result: "failed" };

  const accountId = form.get("accountId");
  const name = form.get("displayName");
  const bio = form.get("bio");
  const expectedName = form.get("expectedName");
  const expectedBio = form.get("expectedBio");
  if (
    typeof accountId !== "string" || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(accountId) ||
    typeof name !== "string" || !name.trim() || Array.from(name.trim()).length > 40 ||
    typeof bio !== "string" || Array.from(bio.trim()).length > 280 ||
    typeof expectedName !== "string" || Array.from(expectedName).length > 40 ||
    typeof expectedBio !== "string" || Array.from(expectedBio).length > 280
  ) return { result: "invalid" };

  const db = await createClient();
  const { data, error } = await db.rpc("edit_admin_community_profile", {
    target_account: accountId,
    new_name: name.trim(),
    new_bio: bio.trim(),
    expected_name: expectedName,
    expected_bio: expectedBio,
  });
  if (error) return { result: "failed" };
  if (data === "stale") {
    revalidatePath(profilesHref);
    return { result: "stale" };
  }
  if (data === "unchanged" || data === "invalid") return { result: data };
  if (data !== "saved") return { result: "failed" };

  revalidatePath(profilesHref);
  revalidatePath("/account");
  revalidatePath("/u/[handle]", "page");
  return { result: "saved" };
}
