
"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function HomeAboutFooter() {
  const { dictionary } = useLanguage();
  const home = dictionary.home;

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
        </div>
      </footer>
    </>
  );
}
