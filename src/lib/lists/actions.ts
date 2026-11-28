"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isListId, listsHref, ownerListHref, publicListHref, type ListState } from "./model";

export async function saveList(_: ListState, form: FormData): Promise<ListState> {
  const claims = await getSessionClaims();
  if (!claims) return { result: "error" };

  const id = form.get("listId");
  const rawTitle = form.get("title");
  const rawDescription = form.get("description");
  if ((id !== null && !isListId(id)) || typeof rawTitle !== "string" || typeof rawDescription !== "string") {
    return { result: "invalid" };
  }
  const title = rawTitle.trim();
  const description = rawDescription.trim();
  if (!title || title.length > 80 || description.length > 400) return { result: "invalid" };

  const db = await createClient();
  const query = id
    ? db.from("community_video_lists").update({ title, description, is_public: form.get("public") === "on" })
        .eq("id", id).eq("user_id", claims.sub)
    : db.from("community_video_lists").insert({ user_id: claims.sub, title, description });
  const { data, error } = await query.select("id").single();
  if (error || !data) return { result: "error" };

  revalidatePath("/library");
  revalidatePath(publicListHref(data.id));
  redirect(`${ownerListHref(data.id)}?saved=1`);
}

export async function updateListItem(_: ListState, form: FormData): Promise<ListState> {
  if (!await getSessionClaims()) return { result: "error" };
  const id = form.get("listId");
  const video = form.get("videoId");
  const operation = form.get("operation");
  if (!isListId(id) || !isListId(video) || (operation !== "add" && operation !== "remove" && operation !== "up" && operation !== "down")) {
    return { result: "invalid" };
  }
  const db = await createClient();
  const { data, error } = await db.rpc("change_community_list_item", {
    target_list: id, target_video: video, operation,
  });
  if (error) return { result: "error" };
  revalidatePath(ownerListHref(id));
  revalidatePath(publicListHref(id));
  return operation === "add" ? { result: data === true ? "added" : "duplicate" } : {};
}

export async function deleteList(_: ListState, form: FormData): Promise<ListState> {
  const claims = await getSessionClaims();
  const id = form.get("listId");
  if (!claims || !isListId(id)) return { result: "error" };
  const db = await createClient();
  const { data, error } = await db.from("community_video_lists").delete().eq("id", id)
    .eq("user_id", claims.sub).select("id").maybeSingle();
  if (error || !data) return { result: "error" };
  revalidatePath("/library");
  revalidatePath(publicListHref(id));
  redirect(listsHref);
}
