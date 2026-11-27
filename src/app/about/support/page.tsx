import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ProjectHeading, ProjectLoading, ProjectPage, projectButton, projectPanel } from "@/components/ProjectPage";
import { editorialRobots } from "@/lib/editorial/metadata";
import { projectCopy } from "@/lib/i18n/project";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Support the creator",
  description: "See how voluntary support could help maintain MONSTER ARCHIVE and improve its editorial tools.",
  alternates: { canonical: "/about/support" },
  robots: editorialRobots,
};

export default function SupportPage() {
  return (
    <ProjectPage>
      <Suspense fallback={<ProjectLoading />}>
        <SupportContent />
      </Suspense>
    </ProjectPage>
  );
}

async function SupportContent() {
  const { about, support } = projectCopy[await getLocale()];

  return (
    <>
      <ProjectHeading title={support.title} intro={support.intro} />

      <section className="mt-10 sm:mt-12" aria-labelledby="support-priorities">
        <h2 id="support-priorities" className="text-2xl font-black tracking-tight">{support.prioritiesTitle}</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {support.priorities.map(({ title, description }) => (
            <li key={title} className={`${projectPanel} p-5`}>
              <h3 className="text-lg font-bold text-purple-200">{title}</h3>
              <p className="mt-2 text-base leading-7 text-zinc-300">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-purple-400/30 bg-purple-500/5 p-6 sm:p-8" aria-labelledby="support-availability">
        <h2 id="support-availability" className="text-xl font-black">{support.availabilityTitle}</h2>
        <p className="mt-2 max-w-xl text-base leading-7 text-zinc-300">{support.availabilityDescription}</p>
        <Link href="/about" className={`${projectButton} mt-5`}>
          {about.title}
        </Link>
      </section>
    </>
  );
}
