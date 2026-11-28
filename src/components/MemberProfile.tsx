"use client";

import Link from "next/link";
import Image from "next/image";

import { useLanguage } from "@/components/LanguageProvider";
import YouTubeThumbnail from "@/components/YouTubeThumbnail";
import { getMemberArchiveCategory, type MemberArchiveCategory } from "@/lib/watch/member-archive-categories";
import type { Member } from "@/data/members";

type Props = {
  member: Member;
  imageUrl: string | null;
  imageAlt: string;
  covers: {
    category: MemberArchiveCategory;
    cover?: { youtube_video_id: string; thumbnail_url: string | null };
  }[];
};

export default function MemberProfile({ member, imageUrl, imageAlt, covers }: Props) {
  const { locale, dictionary } = useLanguage();
  const copy = dictionary.memberProfile;
  const bio = member.bio[locale];
  const { slug } = member;

  const formattedBirthday = new Intl.DateTimeFormat(
    locale === "pt-BR" ? "pt-BR" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(new Date(`${member.birthday}T00:00:00.000Z`));

  const labels =
    locale === "pt-BR"
      ? {
          nationality: "Nacionalidade",
          birthday: "Nascimento",
          archiveEyebrow: "ARQUIVO DA INTEGRANTE",
          archiveTitle: "Explore os vídeos.",
          archiveDescription:
            "Performances, entrevistas e momentos especiais de cada integrante.",
          biographyEyebrow: "CONHEÇA A INTEGRANTE",
          biographyTitle: `A história de ${member.name}.`,
          earlyInterest: "Primeiros interesses",
          ygJourney: "Trajetória na YG",
          offStage: "Personalidade e interesses",
          highlights: "Momentos importantes",
          sources: "Fontes e entrevistas",
          sourceDescription:
            "Referências públicas utilizadas para construir esta biografia.",
          backToMembers: "VOLTAR PARA TODAS AS INTEGRANTES",
        }
      : {
          nationality: "Nationality",
          birthday: "Date of birth",
          archiveEyebrow: "MEMBER ARCHIVE",
          archiveTitle: "Explore the videos.",
          archiveDescription:
            "Performances, interviews and special moments from each member.",
          biographyEyebrow: "GET TO KNOW THE MEMBER",
          biographyTitle: `${member.name}'s story.`,
          earlyInterest: "Early interests",
          ygJourney: "Journey at YG",
          offStage: "Personality and interests",
          highlights: "Career highlights",
          sources: "Sources and interviews",
          sourceDescription:
            "Public references used to build this biography.",
          backToMembers: "BACK TO ALL MEMBERS",
        };

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      {/* MEMBER HERO */}

      <section className="mx-auto max-w-7xl px-6 py-16">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-purple-400">
          BABYMONSTER / {copy.archiveLabel} / {member.number}
        </p>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">

          {/* MEMBER INFORMATION */}

          <div>
            <h1 className="text-[clamp(3.5rem,9vw,7rem)] font-black leading-none tracking-tight">
              {member.name}
              <span className="text-purple-400">.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400">
              {bio.intro}
            </p>

            {/* MEMBER FACTS */}

            <div className="mt-9 grid max-w-xl grid-cols-2 gap-3">

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500">
                  {labels.nationality.toUpperCase()}
                </p>

                <p className="mt-3 text-lg font-black">
                  {member.nationality[locale]}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500">
                  {labels.birthday.toUpperCase()}
                </p>

                <p className="mt-3 text-lg font-black">
                  {formattedBirthday}
                </p>
              </div>

            </div>

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

      {/* MEMBER VIDEO ARCHIVE */}

      <section
        id="member-videos"
        className="border-t border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-purple-400">
            {labels.archiveEyebrow}
          </p>

          <h2 className="text-3xl font-black md:text-4xl">
            {labels.archiveTitle}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            {labels.archiveDescription}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {covers.map(({ category, cover }) => {
              const { title, description, gradient } = getMemberArchiveCategory(category, copy);
              const cardClass = "overflow-hidden rounded-xl border border-white/10 bg-[#101116]";
              const cardText = (
                <div className="p-6">
                  <h3 className="text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
                </div>
              );

              return (
                <Link
                  key={category}
                  href={`/members/${slug}/videos/${category}`}
                  className={`group block ${cardClass} transition hover:border-purple-400/50 focus-visible:outline-2 focus-visible:outline-purple-400`}
                >
                  {cover && (
                    <YouTubeThumbnail
                      videoId={cover.youtube_video_id}
                      thumbnailUrl={cover.thumbnail_url}
                      alt=""
                      fallbackGradient={gradient}
                      showLabels={false}
                    />
                  )}
                  {cardText}
                  {!cover && <p className="px-6 pb-6 text-xs font-bold text-zinc-400">{copy.archiveEmpty}</p>}
                </Link>
              );
            })}

          </div>

        </div>
      </section>

      {/* MEMBER BIOGRAPHY */}

      <section
        id="about"
        className="border-t border-white/10"
      >
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-purple-400">
            {labels.biographyEyebrow}
          </p>

          <h2 className="text-3xl font-black md:text-5xl">
            {labels.biographyTitle}
          </h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">

            {/* EARLY INTEREST */}

            <article className="rounded-xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

              <p className="text-[10px] font-bold tracking-[0.2em] text-purple-400">
                01 / {labels.earlyInterest.toUpperCase()}
              </p>

              <h3 className="mt-5 text-xl font-black">
                {bio.earlyInterestTitle}
              </h3>

              <p className="mt-4 text-sm leading-8 text-zinc-400">
                {bio.earlyInterest}
              </p>

            </article>

            {/* YG JOURNEY */}

            <article className="rounded-xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

              <p className="text-[10px] font-bold tracking-[0.2em] text-purple-400">
                02 / {labels.ygJourney.toUpperCase()}
              </p>

              <h3 className="mt-5 text-xl font-black">
                {bio.ygJourneyTitle}
              </h3>

              <p className="mt-4 text-sm leading-8 text-zinc-400">
                {bio.ygJourney}
              </p>

            </article>

            {/* PERSONALITY */}

            <article className="rounded-xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

              <p className="text-[10px] font-bold tracking-[0.2em] text-purple-400">
                03 / {labels.offStage.toUpperCase()}
              </p>

              <h3 className="mt-5 text-xl font-black">
                {bio.offStageTitle}
              </h3>

              <p className="mt-4 text-sm leading-8 text-zinc-400">
                {bio.offStage}
              </p>

            </article>

            {/* CAREER HIGHLIGHTS */}

            <article className="rounded-xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

              <p className="text-[10px] font-bold tracking-[0.2em] text-purple-400">
                04 / {labels.highlights.toUpperCase()}
              </p>

              <h3 className="mt-5 text-xl font-black">
                {bio.highlightsTitle}
              </h3>

              <ul className="mt-5 space-y-4">

                {bio.highlights.map((highlight, index) => (
                  <li
                    key={`${member.slug}-highlight-${index}`}
                    className="flex gap-3 text-sm leading-7 text-zinc-400"
                  >
                    <span className="mt-1 shrink-0 text-purple-400">
                      ✦
                    </span>

                    <span>{highlight}</span>
                  </li>
                ))}

              </ul>

            </article>

          </div>

          {/* SOURCES */}

          <div className="mt-12 border-t border-white/10 pt-8">

            <p className="text-xs font-bold tracking-[0.25em] text-zinc-400">
              {labels.sources.toUpperCase()}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              {labels.sourceDescription}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              {bio.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-purple-400/50 hover:text-purple-300"
                >
                  {source.label} ↗
                </a>
              ))}

            </div>

          </div>

          <div className="mt-14 border-t border-white/10 pt-8">
            <Link
              href="/members"
              className="text-xs font-bold tracking-widest text-zinc-400 transition hover:text-white"
            >
              ← {labels.backToMembers}
            </Link>
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
