export const profilesHref = "/admin/profiles";
export const profileDirectoryPageSize = 20;

export type ProfileSort = "newest" | "oldest";

export type ProfileDirectoryEntry = {
  account_id: string;
  registered_at: string | null;
  confirmed: boolean;
  suspended_until: string | null;
  account_role: AccountRole;
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  is_public: boolean | null;
  moderation_hidden: boolean | null;
  last_edited_at: string | null;
};

export type ProfileEditResult = "saved" | "unchanged" | "stale" | "invalid" | "failed";
export type ProfileEditState = { result?: ProfileEditResult };

export function directoryHref({ sort, search, page = 1 }: { sort: ProfileSort; search: string; page?: number }) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (sort === "oldest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return params.size ? `${profilesHref}?${params}` : profilesHref;
}

export const accountRoles = ["member", "moderator", "admin"] as const;
export const accountOperations = ["suspend", "revoke", "role", "remove_profile", "delete_account"] as const;
export type AccountRole = (typeof accountRoles)[number];
export type AccountOperation = (typeof accountOperations)[number];
export type AccountControlResult = "saved" | "unchanged" | "stale" | "invalid" | "ineligible" | "protected" | "unavailable" | "owns_files" | "failed";
export type AccountControlState = { result?: AccountControlResult };
export type AccountAdminEvent = {
  id: string;
  actor_id: string;
  actor_name: string | null;
  target_id: string;
  target_handle: string | null;
  operation: AccountOperation;
  reason: string;
  previous_role: AccountRole;
  new_role: AccountRole | null;
  effective_until: string | null;
  created_at: string;
};

export function accountActivityHref(page = 1) {
  return `${profilesHref}?view=activity${page > 1 ? `&page=${page}` : ""}`;
}
