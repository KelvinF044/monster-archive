import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import MemberArchiveCategoryPage from "@/components/MemberArchiveCategoryPage";
import { getFavoriteVideoIds } from "@/lib/favorites/data";
import { createClient } from "@/lib/supabase/server";
import { getVideoEras } from "@/lib/watch/eras";
import { getMemberArchiveVideos } from "@/lib/watch/member-archive";
import { isMemberArchiveCategory } from "@/lib/watch/member-archive-categories";

type Props = {
  params: Promise<{ slug: string; category: string }>;
};

export default function MemberVideosPage({ params }: Props) {
  return (
    <Suspense fallback={<main aria-busy="true" className="min-h-[60vh] bg-[#08090d]" />}>
      <MemberVideos params={params} />
    </Suspense>
  );
}

async function MemberVideos({ params }: Props) {
  await connection();

  const { slug, category } = await params;
  if (!isMemberArchiveCategory(category)) notFound();

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("members")
    .select("id, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!member) notFound();

  const videos = await getMemberArchiveVideos(supabase, member.id, category);
  const [eras, savedIds] = await Promise.all([
    getVideoEras(supabase, videos),
    getFavoriteVideoIds(videos.map(({ id }) => id)),
  ]);

  return (
    <MemberArchiveCategoryPage
      slug={slug}
      memberName={member.name}
      category={category}
      videos={videos}
      eras={eras}
      savedIds={savedIds}
    />
  );
}
