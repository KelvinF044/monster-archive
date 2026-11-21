
import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { members } from "@/data/members";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { Suspense } from "react";

export default function MembersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#08090d] px-6 py-20 text-white">
          <div className="mx-auto max-w-7xl animate-pulse">
            <div className="h-10 w-64 rounded bg-white/10" />

            <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/5] rounded-xl bg-white/5"
                />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <MembersContent />
    </Suspense>
  );
}

async function MembersContent() {
  await connection();

  const { dictionary } = await getDictionary();
  const copy = dictionary.members;

  const supabase = await createClient();

  const { data: memberImages, error } = await supabase
    .from("members")
    .select("slug, image_url, image_alt")
    .eq("is_active", true);

  if (error) {
    console.error(
      "Error loading member images:",
      error.message
    );
  }

  const membersWithImages = members.map((member) => {
    const image = memberImages?.find(
      (item) => item.slug === member.slug
    );

    return {
      ...member,
      imageUrl: image?.image_url ?? null,
      imageAlt: image?.image_alt ?? null,
    };
  });

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <section className="mx-auto max-w-7xl px-6 py-20">

        {/* PAGE INTRODUCTION */}

        <div className="mb-14">
          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-purple-400">
            {copy.eyebrow}
          </p>

          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            {copy.title}<span className="text-purple-400">.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            {copy.description}
          </p>
        </div>

        {/* MEMBERS HEADER */}

        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <h2 className="text-sm font-bold tracking-widest">
            {copy.allMembers}
          </h2>

          <span className="text-xs text-zinc-500">
            07 {copy.memberCount}
          </span>
        </div>

        {/* MEMBERS GRID */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {membersWithImages.map((member) => (
            <Link
              key={member.slug}
              href={`/members/${member.slug}`}
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-purple-400/50"
            >

              {/* MEMBER PHOTOGRAPH */}

              <div
                className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br ${member.gradient}`}
              >

                {member.imageUrl && (
                  <Image
                    src={member.imageUrl}
                    alt={
                      member.imageAlt ||
                      `${member.name} — BABYMONSTER`
                    }
                    fill
                    sizes="(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) calc((100vw - 4.25rem)/2), (max-width: 1279px) calc((100vw - 5.5rem)/3), 18.5rem"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}

                {/* IMAGE OVERLAY */}

                <div className="absolute inset-0 bg-black/20 transition group-hover:bg-transparent" />

                {/* FALLBACK */}

                {!member.imageUrl && (
                  <span className="relative text-7xl font-black tracking-tighter text-white/10 transition duration-500 group-hover:scale-110">
                    {member.number}
                  </span>
                )}

              </div>

              {/* MEMBER INFORMATION */}

              <div className="p-5">
                <h3 className="text-2xl font-black tracking-wide">
                  {member.name}
                </h3>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500">
                    {copy.profileLink}
                  </span>

                  <span className="text-purple-400">
                    ↗
                  </span>
                </div>
              </div>

            </Link>
          ))}

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
