
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { members } from "@/data/members";
import { createClient } from "@/lib/supabase/server";
import MemberProfile from "@/components/MemberProfile";
import { getMemberArchiveVideos } from "@/lib/watch/member-archive";
import { memberArchiveCategoryKeys } from "@/lib/watch/member-archive-categories";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return members.map((member) => ({
    slug: member.slug,
  }));
}

function MemberProfileLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-5 w-64 rounded bg-white/10" />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-72 rounded-xl bg-white/5" />
          <div className="aspect-[4/5] rounded-xl bg-white/5" />
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 rounded-xl bg-white/5"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function MemberProfilePage({ params }: PageProps) {
  return (
    <Suspense fallback={<MemberProfileLoading />}>
      <MemberProfileContent params={params} />
    </Suspense>
  );
}

async function MemberProfileContent({ params }: PageProps) {
  await connection();

  const { slug } = await params;

  const member = members.find((item) => item.slug === slug);

  if (!member) {
    notFound();
  }

  const supabase = await createClient();

  const { data: memberData, error } = await supabase
    .from("members")
    .select("id, image_url, image_alt")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Error loading member profile image:",
      error.message
    );
  }

  const imageUrl = memberData?.image_url ?? null;

  const imageAlt =
    memberData?.image_alt ||
    `${member.name} — BABYMONSTER`;

  const covers = await Promise.all(
    memberArchiveCategoryKeys.map(async (category) => {
      const [cover] = memberData
        ? await getMemberArchiveVideos(supabase, memberData.id, category, 1).catch((archiveError) => {
            console.error("Error loading member archive:", archiveError.message);
            return [];
          })
        : [];

      return {
        category,
        cover: cover && {
          youtube_video_id: cover.youtube_video_id,
          thumbnail_url: cover.thumbnail_url,
        },
      };
    })
  );

  return <MemberProfile member={member} imageUrl={imageUrl} imageAlt={imageAlt} covers={covers} />;
}
