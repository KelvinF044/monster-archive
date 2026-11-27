import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CopyListLink, DeleteListButton, ListItemControls, ListMetadataForm } from "@/components/CommunityListForms";
import YouTubeThumbnail from "@/components/YouTubeThumbnail";
import { getSessionClaims } from "@/lib/auth/session";
import { libraryPageSize } from "@/lib/favorites/data";
import { favoritesMessages } from "@/lib/favorites/messages";
import { getLocale } from "@/lib/i18n/server";
import { getOwnedList } from "@/lib/lists/data";
import { listsMessages } from "@/lib/lists/messages";
import { isListId, listsHref, ownerListHref, publicListHref } from "@/lib/lists/model";

export default async function OwnedListPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  const [claims, locale, { id }, query] = await Promise.all([getSessionClaims(), getLocale(), params, searchParams]);
  if (!claims) redirect("/login?next=library");
  if (!isListId(id)) notFound();
  const href = ownerListHref(id);
  const page = Number(query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) redirect(href);
  const result = await getOwnedList(claims.sub, id, page, libraryPageSize);
  if (!result) notFound();
  if (page > 1 && !result.videos.length) redirect(href);

  const { list, videos, hasNext } = result;
  const copy = listsMessages(locale);
  const library = favoritesMessages(locale);
  return (
    <main className="community-surface min-h-[calc(100svh-5rem)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href={listsHref} className="text-sm font-semibold text-purple-200 hover:underline">← {library.library}</Link>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 break-words text-3xl font-black sm:text-4xl">{list.title}</h1>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold">{list.is_public ? copy.public : copy.private}</span>
        </div>
        {list.description && <p className="mt-3 max-w-2xl whitespace-pre-wrap break-words text-zinc-300">{list.description}</p>}
        {query.saved === "1" && <p role="status" className="mt-3 text-sm text-purple-200">{copy.saved}</p>}
        {list.is_public && (
          <div className="mt-5 flex flex-wrap items-start gap-3">
            <Link href={publicListHref(id)} prefetch={false} className="flex min-h-10 items-center rounded-lg border border-purple-400/35 px-3 text-sm font-semibold text-purple-200 hover:bg-purple-500/15">{copy.viewShared}</Link>
            <CopyListLink id={id} />
          </div>
        )}

        <details className="my-7 max-w-xl rounded-xl border border-white/10 bg-[#15111d] p-4">
          <summary className="cursor-pointer text-sm font-bold">{copy.edit}</summary>
          <div className="mt-5">
            <ListMetadataForm key={JSON.stringify(list)} list={list} />
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <DeleteListButton id={id} />
          </div>
        </details>

        {videos.length ? (
          <ol start={(page - 1) * libraryPageSize + 1} className="space-y-3">
            {videos.map((video, index) => {
              const title = video.title ?? copy.unavailableVideo;
              return (
                <li key={video.video_id} className="grid min-w-0 gap-3 rounded-xl border border-white/10 bg-[#15111d] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  {video.collection_slug && video.youtube_video_id ? (
                    <Link href={`/watch/${video.collection_slug}/${video.video_slug}`} className="flex min-w-0 items-center gap-3 text-sm font-semibold hover:text-purple-200">
                      <div className="w-24 shrink-0 overflow-hidden rounded-md sm:w-32">
                        <YouTubeThumbnail videoId={video.youtube_video_id} thumbnailUrl={video.thumbnail_url} alt="" fallbackGradient="from-purple-950 to-[#100c16]" />
                      </div>
                      <span className="min-w-0 break-words">{title}</span>
                    </Link>
                  ) : <p className="text-sm text-zinc-400">{title}</p>}
                  <ListItemControls listId={id} videoId={video.video_id} title={title} canMoveUp={page > 1 || index > 0} canMoveDown={hasNext || index < videos.length - 1} />
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#15111d] p-6">
            <p>{copy.emptyVideos}</p>
            <Link href="/watch" className="mt-3 inline-block text-sm font-semibold text-purple-200 hover:underline">{library.browse}</Link>
          </div>
        )}

        {(page > 1 || hasNext) && (
          <nav aria-label={copy.lists} className="mt-6 flex gap-4 text-sm font-semibold text-purple-200">
            {page > 1 && <Link href={page === 2 ? href : `${href}?page=${page - 1}`}>{library.previous}</Link>}
            {hasNext && <Link href={`${href}?page=${page + 1}`}>{library.next}</Link>}
          </nav>
        )}
      </div>
    </main>
  );
}
