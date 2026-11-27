import type { ReactNode } from "react";

export const projectPanel = "rounded-2xl border border-white/10 bg-white/[0.03]";
export const projectButton = "inline-flex min-h-11 items-center justify-center rounded-lg border border-purple-400/45 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 transition hover:border-purple-300 hover:bg-purple-500/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400";

export function ProjectPage({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 bg-[#08090d] px-5 pb-16 text-white sm:px-8 sm:pb-24">
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}

export function ProjectHeading({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="border-b border-white/10 pb-10 pt-14 sm:pb-14 sm:pt-20">
      <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
        {title}<span className="text-purple-400" aria-hidden="true">.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">{intro}</p>
    </header>
  );
}

export function ProjectLoading() {
  return <div className="my-14 h-40 animate-pulse rounded-2xl bg-white/5 sm:my-20" aria-hidden="true" />;
}
