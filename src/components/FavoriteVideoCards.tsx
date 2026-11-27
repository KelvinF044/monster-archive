import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import YouTubeThumbnail from "@/components/YouTubeThumbnail";
import type { FavoriteCard } from "@/lib/favorites/data";

export default function FavoriteVideoCards({ cards, editable = false }: { cards: FavoriteCard[]; editable?: boolean }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((video) => (
        <li key={video.video_id} className="min-w-0 rounded-xl border border-white/10 bg-[#15111d]">
          <Link href={`/watch/${video.collection_slug}/${video.video_slug}`} className="block overflow-hidden rounded-t-xl focus-visible:outline-2 focus-visible:outline-purple-400">
            <YouTubeThumbnail
              videoId={video.youtube_video_id}
              thumbnailUrl={video.thumbnail_url}
              alt=""
              fallbackGradient="from-purple-950 to-[#100c16]"
            />
            <h3 className="break-words px-4 pt-4 pb-3 text-sm font-bold hover:text-purple-200">{video.title}</h3>
          </Link>
          {editable && <div className="flex justify-end px-4 pb-4"><FavoriteButton videoId={video.video_id} title={video.title} saved compact /></div>}
        </li>
      ))}
    </ul>
  );
}
