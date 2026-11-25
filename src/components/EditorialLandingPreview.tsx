"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const copy = {
  en: {
    news: {
      title: "News",
      description: "Follow BABYMONSTER announcements, releases and noteworthy moments.",
      empty: "The news archive is being prepared.",
    },
    schedule: {
      title: "Events",
      description: "Explore the official schedule and public activities of BABYMONSTER.",
      empty: "The official events calendar is being prepared.",
    },
    preview: "PHASE 2.3 / PREVIEW",
    explanation: "This section is being developed in the testing environment. Verified content will be available after editorial review.",
    back: "Back to Home",
  },
  "pt-BR": {
    news: {
      title: "Notícias",
      description: "Acompanhe comunicados, lançamentos e momentos marcantes do BABYMONSTER.",
      empty: "O arquivo de notícias está sendo preparado.",
    },
    schedule: {
      title: "Eventos",
      description: "Explore a agenda oficial e as atividades públicas do BABYMONSTER.",
      empty: "O calendário oficial de eventos está sendo preparado.",
    },
    preview: "FASE 2.3 / HOMOLOGAÇÃO",
    explanation: "Esta seção está em desenvolvimento no ambiente de testes. Os conteúdos verificados estarão disponíveis após a revisão editorial.",
    back: "Voltar ao início",
  },
};

export default function EditorialLandingPreview({ section }: { section: "news" | "schedule" }) {
  const { locale } = useLanguage();
  const text = copy[locale];

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-16 text-white md:py-24">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold tracking-[0.25em] text-purple-400">MONSTER ARCHIVE / {text.preview}</p>
        <h1 className="mt-5 text-4xl font-black md:text-6xl">{text[section].title}.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">{text[section].description}</p>
        <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <h2 className="text-xl font-bold">{text[section].empty}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">{text.explanation}</p>
          <Link href="/" className="mt-7 inline-flex rounded-lg border border-purple-400/30 px-5 py-3 text-xs font-bold text-purple-300 transition hover:bg-purple-500/10">
            {text.back} →
          </Link>
        </div>
      </div>
    </main>
  );
}
