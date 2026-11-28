"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "@/components/LanguageProvider";

type MemberCard = {
  slug: string;
  name: string;
  number: string;
  gradient: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

export default function MembersDirectory({ members }: { members: MemberCard[] }) {
  const { dictionary } = useLanguage();
  const copy = dictionary.members;

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

          {members.map((member) => (
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
