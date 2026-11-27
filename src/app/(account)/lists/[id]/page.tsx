import { notFound } from "next/navigation";
import { connection } from "next/server";
import FavoriteVideoCards from "@/components/FavoriteVideoCards";
import { getLocale } from "@/lib/i18n/server";
import { getSharedList } from "@/lib/lists/data";
import { listsMessages } from "@/lib/lists/messages";
import { isListId } from "@/lib/lists/model";

export default async function SharedListPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!isListId(id)) notFound();
  const [list, locale] = await Promise.all([getSharedList(id), getLocale()]);
  if (!list) notFound();

  return (
    <main className="community-surface min-h-[calc(100svh-5rem)] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="break-words text-3xl font-black sm:text-4xl">{list.title}</h1>
        {list.description && <p className="mt-3 max-w-2xl whitespace-pre-wrap break-words text-zinc-300">{list.description}</p>}
        <div className="mt-7">
          {list.videos.length ? <FavoriteVideoCards cards={list.videos} /> : <p className="text-zinc-300">{listsMessages(locale).emptyVideos}</p>}
        </div>
      </div>
    </main>
  );
}
