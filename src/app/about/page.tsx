import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ProjectHeading, ProjectLoading, ProjectPage, projectButton, projectPanel } from "@/components/ProjectPage";
import { editorialRobots } from "@/lib/editorial/metadata";
import { archiveSections, projectCopy } from "@/lib/i18n/project";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "About the project",
  description: "Learn how MONSTER ARCHIVE preserves and organizes BABYMONSTER videos, news and events.",
  alternates: { canonical: "/about" },
  robots: editorialRobots,
};

export default function AboutPage() {
  return (
    <ProjectPage>
      <Suspense fallback={<ProjectLoading />}>
        <AboutContent />
      </Suspense>
    </ProjectPage>
  );
}

async function AboutContent() {
  const { dictionary, locale } = await getDictionary();
  const { about, support } = projectCopy[locale];
  const navigation = dictionary.navigation;
  const labels = {
    "/members": navigation.members,
    "/watch": navigation.watch,
    "/news": navigation.news,
    "/schedule": navigation.events,
  };

  return (
    <>
      <ProjectHeading title={about.title} intro={about.intro} />

      <section className="mt-10 sm:mt-12" aria-labelledby="archive-sections">
        <h2 id="archive-sections" className="text-2xl font-black tracking-tight">{about.archiveTitle}</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {archiveSections.map((href) => (
            <li key={href}>
              <Link href={href} className={`${projectPanel} block h-full p-5 transition hover:border-purple-400/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400`}>
                <h3 className="text-lg font-bold text-purple-200">{labels[href]}</h3>
                <p className="mt-2 text-base leading-7 text-zinc-300">{about.archiveDescriptions[href]}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="archive-curation">
        <h2 id="archive-curation" className="text-2xl font-black tracking-tight">{about.editorialTitle}</h2>
        <p className="mt-3 text-base leading-7 text-zinc-300">{about.editorialDescription}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{dictionary.home.footerDisclaimer}</p>
      </section>

      <section className={`${projectPanel} mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`} aria-labelledby="about-support">
        <div>
          <h2 id="about-support" className="text-xl font-black">{support.title}</h2>
          <p className="mt-2 max-w-xl text-base leading-7 text-zinc-300">{about.supportDescription}</p>
        </div>
        <Link href="/about/support" className={`${projectButton} shrink-0`}>
          {about.supportLink}
        </Link>
      </section>
    </>
  );
}
