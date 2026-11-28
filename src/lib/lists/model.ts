export const listsHref = "/library?tab=lists";

export type ListState = { result?: "added" | "duplicate" | "invalid" | "error" };

export function isListId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
}

export function ownerListHref(id: string) {
  return `/library/lists/${id}`;
}

export function publicListHref(id: string) {
  return `/lists/${id}`;
}
