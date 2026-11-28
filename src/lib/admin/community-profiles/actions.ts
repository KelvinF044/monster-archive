"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { getAccount } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  accountDeletedHref, accountOperations, accountRoles, profilesHref,
  type AccountControlState, type AccountOperation, type AccountRole, type ProfileEditState,
} from "./model";

const uuidPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export async function updateCommunityProfile(_: ProfileEditState, form: FormData): Promise<ProfileEditState> {
  if ((await getAccount())?.role !== "admin") return { result: "failed" };

  const accountId = form.get("accountId");
  const name = form.get("displayName");
  const bio = form.get("bio");
  const expectedName = form.get("expectedName");
  const expectedBio = form.get("expectedBio");
  if (
    typeof accountId !== "string" || !uuidPattern.test(accountId) ||
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

export async function manageCommunityAccount(_: AccountControlState, form: FormData): Promise<AccountControlState> {
  if ((await getAccount())?.role !== "admin") return { result: "failed" };

  const accountId = form.get("accountId");
  const operation = form.get("operation") as AccountOperation;
  const expectedRole = form.get("expectedRole") as AccountRole;
  const expectedUntil = form.get("expectedUntil");
  const role = form.get("newRole") as AccountRole | null;
  const reason = form.get("reason");
  const confirmation = form.get("confirmation");
  const quantity = Number(form.get("quantity"));
  const unit = form.get("unit");
  const duration = quantity * (unit === "days" ? 24 : 1);

  if (
    typeof accountId !== "string" || !uuidPattern.test(accountId) || !accountOperations.includes(operation) ||
    !accountRoles.includes(expectedRole) || typeof expectedUntil !== "string" ||
    (expectedUntil && !Number.isFinite(Date.parse(expectedUntil))) ||
    typeof reason !== "string" || Array.from(reason.trim()).length > 400 ||
    (operation === "suspend" && (
      (unit !== "hours" && unit !== "days") || !Number.isSafeInteger(quantity) ||
      duration < 1 || duration > 8760 || !reason.trim()
    )) ||
    (operation === "role" && (!role || !accountRoles.includes(role))) ||
    ((operation === "remove_profile" || operation === "delete_account") && (typeof confirmation !== "string" || confirmation.length > 40))
  ) return { result: "invalid" };

  const db = await createClient();
  const { data, error } = await db.rpc("manage_admin_community_account", {
    target_account: accountId,
    operation,
    duration_hours: operation === "suspend" ? duration : null,
    reason: reason.trim(),
    new_role: operation === "role" ? role : null,
    expected_role: expectedRole,
    expected_until: expectedUntil || null,
    confirmation: typeof confirmation === "string" ? confirmation.trim() : null,
  });
  if (error) return { result: "failed" };
  if (data === "stale") revalidatePath(profilesHref);
  if (data === "saved") {
    revalidatePath(profilesHref);
    revalidatePath("/account");
    revalidatePath("/u/[handle]", "page");
    if (operation === "delete_account") {
      revalidatePath("/lists/[id]", "page");
      redirect(accountDeletedHref, RedirectType.replace);
    }
  }
  if (
    data === "saved" || data === "unchanged" || data === "stale" || data === "invalid" ||
    data === "protected" || data === "ineligible" || data === "unavailable" || data === "owns_files"
  ) return { result: data };
  return { result: "failed" };
}
