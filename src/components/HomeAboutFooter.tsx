
"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { projectCopy } from "@/lib/i18n/project";

const linkClass = "rounded-sm font-semibold text-purple-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400";

export default function HomeAboutFooter() {
  const { dictionary, locale } = useLanguage();
  const home = dictionary.home;
  const project = projectCopy[locale];

  return (
    <>
      {/* ABOUT */}

      <section
        id="about"
        className="border-t border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-purple-400">
            {home.aboutEyebrow}
          </p>

          <h2 className="mt-5 text-3xl font-black md:text-5xl">
            {home.aboutTitle}
            <br />

            <span className="text-zinc-500">
              {home.aboutSubtitle}
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-500">
            {home.aboutDescription}
          </p>

          <Link href="/about" className={`mt-6 inline-block text-sm ${linkClass}`}>
            {project.about.title}
          </Link>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-zinc-600">
          <span className="font-black tracking-widest">
            MONSTER ARCHIVE
          </span>

          <span>
            {home.footerDisclaimer}
          </span>

          <Link href="/about/support" className={`text-sm ${linkClass}`}>
            {project.support.title}
          </Link>
        </div>
      </footer>
    </>
  );
}
