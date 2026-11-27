export const profilesHref = "/admin/profiles";
export const profileDirectoryPageSize = 20;

export type ProfileSort = "newest" | "oldest";

export type ProfileDirectoryEntry = {
  account_id: string;
  registered_at: string | null;
  confirmed: boolean;
  suspended_until: string | null;
  account_role: "admin" | "moderator" | "member";
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
