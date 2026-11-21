
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { members } from "@/data/members";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return members.map((member) => ({
    slug: member.slug,
  }));
}

export default function MemberProfilePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#08090d] px-6 py-20 text-white">
          <div className="mx-auto max-w-7xl animate-pulse">
            <div className="h-5 w-64 rounded bg-white/10" />

            <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="h-72 rounded-xl bg-white/5" />
              <div className="aspect-[4/5] rounded-xl bg-white/5" />
            </div>
          </div>
        </main>
      }
    >
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

  const { dictionary } = await getDictionary();
  const copy = dictionary.memberProfile;

  const replaceName = (text: string) =>
    text.replaceAll("{name}", member.name);

  const supabase = await createClient();

  const { data: memberData, error } = await supabase
    .from("members")
    .select("image_url, image_alt")
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

  const profileSections = [
    {
      title: copy.performancesTitle,
      detail: copy.performancesDescription,
    },
    {
      title: copy.varietyTitle,
      detail: copy.varietyDescription,
    },
    {
      title: copy.behindTitle,
      detail: copy.behindDescription,
    },
  ];

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      {/* PROFILE HERO */}

      <section className="mx-auto max-w-7xl px-6 py-16">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-purple-400">
          BABYMONSTER / {copy.archiveLabel} / {member.number}
        </p>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">

          {/* MEMBER INFORMATION */}

          <div>
            <h1 className="text-6xl font-black tracking-tight md:text-8xl">
              {member.name}
              <span className="text-purple-400">.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400">
              {replaceName(copy.profileDescription)}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">

              <a
                href="#about"
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-purple-200"
              >
                {copy.exploreProfile}
              </a>

              <Link
                href="/members"
                className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {copy.allMembers}
              </Link>

            </div>
          </div>

          {/* MEMBER PHOTOGRAPH */}

          <div
            className={`relative flex aspect-[4/5] max-h-[500px] items-center justify-center overflow-hidden rounded-2xl border ${
              imageUrl
                ? "border-zinc-700/60 bg-zinc-950"
                : `border-white/10 bg-gradient-to-br ${member.gradient}`
            }`}
          >

            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 40vw, 500px"
                  preload
                  quality={85}
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/15" />
              </>
            ) : (
              <span className="text-[180px] font-black text-white/10">
                {member.number}
              </span>
            )}

          </div>

        </div>
      </section>

      {/* MEMBER ABOUT */}

      <section
        id="about"
        className="border-t border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-purple-400">
            {copy.informationEyebrow}
          </p>

          <h2 className="text-3xl font-black">
            {replaceName(copy.aboutTitle)}
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-zinc-400">
            {replaceName(copy.aboutDescription)}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">

            {profileSections.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-sm font-black tracking-wider text-white">
                  {item.title}
                </p>

                <p className="mt-3 text-sm text-zinc-500">
                  {item.detail}
                </p>

                <p className="mt-6 text-xs text-purple-400">
                  {copy.comingSoon}
                </p>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-xs text-zinc-600">

          <span className="font-black tracking-widest">
            MONSTER ARCHIVE
          </span>

          <span>
            {copy.footerDisclaimer}
          </span>

        </div>
      </footer>

    </main>
  );
}
