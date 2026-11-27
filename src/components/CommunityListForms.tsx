"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import { deleteList, saveList, updateListItem } from "@/lib/lists/actions";
import type { VideoList } from "@/lib/lists/data";
import { listsMessages } from "@/lib/lists/messages";
import { listsHref, publicListHref, type ListState } from "@/lib/lists/model";

const button = "inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-200 hover:border-purple-400 focus-visible:outline-2 focus-visible:outline-purple-400 disabled:opacity-60";
const primary = "rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled:opacity-60";
const field = "mt-1.5 w-full min-w-0 rounded-lg border border-white/20 bg-[#111019] px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-purple-400";

function ListFeedback({ state }: { state: ListState }) {
  const { locale } = useLanguage();
  if (!state.result) return null;
  const failed = state.result === "error" || state.result === "invalid";
  return <p role={failed ? "alert" : "status"} className={`text-sm ${failed ? "text-red-200" : "text-purple-200"}`}>{listsMessages(locale)[state.result]}</p>;
}

export function ListMetadataForm({ list }: { list?: VideoList }) {
  const { locale } = useLanguage();
  const copy = listsMessages(locale);
  const [state, submit, pending] = useActionState(saveList, {});
  const [title, setTitle] = useState(list?.title ?? "");
  const [description, setDescription] = useState(list?.description ?? "");
  const [isPublic, setIsPublic] = useState(list?.is_public ?? false);

  return (
    <form action={submit} className="space-y-4">
      {list && <input type="hidden" name="listId" value={list.id} />}
      <label className="block text-sm font-semibold">
        {copy.title}
        <input className={field} name="title" required maxLength={80} value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
      </label>
      <label className="block text-sm font-semibold">
        {copy.description}
        <textarea className={field} name="description" rows={2} maxLength={400} value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
      </label>
      {list && (
        <label className="flex items-center gap-2 text-sm text-zinc-200">
          <input name="public" type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.currentTarget.checked)} className="accent-purple-400" />
          {copy.visibility}
        </label>
      )}
      <button type="submit" className={primary} disabled={pending}>{list ? copy.save : copy.create}</button>
      <ListFeedback state={state} />
    </form>
  );
}

export function AddToListPicker({ videoId, choices }: {
  videoId: string;
  choices: Pick<VideoList, "id" | "title">[] | null;
}) {
  const { locale } = useLanguage();
  const copy = listsMessages(locale);
  const [state, submit, pending] = useActionState(updateListItem, {});
  return (
    <details className="relative">
      <summary className={`cursor-pointer list-none ${button}`}>{copy.addToList}</summary>
      <div className="z-10 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-white/15 bg-[#181421] p-4 shadow-xl shadow-black/45 sm:absolute sm:right-0">
        {!choices ? <p role="alert" className="text-sm text-red-200">{copy.loadError}</p> : choices.length ? (
          <form action={submit} className="space-y-3">
            <input type="hidden" name="videoId" value={videoId} />
            <input type="hidden" name="operation" value="add" />
            <label className="block text-sm font-semibold">
              {copy.chooseList}
              <select className={field} name="listId" required defaultValue="">
                <option value="" disabled>{copy.chooseList}</option>
                {choices.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}
              </select>
            </label>
            <button type="submit" className={primary} disabled={pending}>{copy.add}</button>
            <ListFeedback state={state} />
          </form>
        ) : <Link href={`${listsHref}#new-list`} className="text-sm font-semibold text-purple-200 hover:underline">{copy.createFirst}</Link>}
      </div>
    </details>
  );
}

export function ListItemControls({ listId, videoId, title, canMoveUp, canMoveDown }: {
  listId: string; videoId: string; title: string; canMoveUp: boolean; canMoveDown: boolean;
}) {
  const { locale } = useLanguage();
  const copy = listsMessages(locale);
  const [state, submit, pending] = useActionState(updateListItem, {});

  return (
    <form action={submit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="videoId" value={videoId} />
      <button type="submit" name="operation" value="up" disabled={pending || !canMoveUp} aria-label={`${copy.up}: ${title}`} className={button}>↑</button>
      <button type="submit" name="operation" value="down" disabled={pending || !canMoveDown} aria-label={`${copy.down}: ${title}`} className={button}>↓</button>
      <button type="submit" name="operation" value="remove" disabled={pending} aria-label={`${copy.remove}: ${title}`} className={button}>{copy.remove}</button>
      <ListFeedback state={state} />
    </form>
  );
}

export function DeleteListButton({ id }: { id: string }) {
  const { locale } = useLanguage();
  const copy = listsMessages(locale);
  const [confirm, setConfirm] = useState(false);
  const [state, submit, pending] = useActionState(deleteList, {});
  if (!confirm) return <button type="button" className={button} onClick={() => setConfirm(true)}>{copy.delete}</button>;

  return (
    <form action={submit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="listId" value={id} />
      <p className="w-full text-sm text-zinc-200">{copy.confirm}</p>
      <button type="submit" disabled={pending} className={`${button} text-red-200`}>{copy.delete}</button>
      <button type="button" disabled={pending} onClick={() => setConfirm(false)} className={button}>{copy.cancel}</button>
      <ListFeedback state={state} />
    </form>
  );
}

export function CopyListLink({ id }: { id: string }) {
  const { locale } = useLanguage();
  const copy = listsMessages(locale);
  const [feedback, setFeedback] = useState<"copied" | "copyError">();
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(publicListHref(id), window.location.origin).href);
      setFeedback("copied");
    } catch {
      setFeedback("copyError");
    }
  }
  return (
    <div className="space-y-2">
      <button type="button" className={button} onClick={copyLink}>{copy.copy}</button>
      {feedback && <p role="status" className="text-sm text-zinc-300">{copy[feedback]}</p>}
    </div>
  );
}
