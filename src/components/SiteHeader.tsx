
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n/config";

function LanguageSwitcher({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  const [open, setOpen] = useState(false);

  const options: {
    code: Locale;
    accessibleLabel: string;
  }[] = [
    {
      code: "en",
      accessibleLabel: "English",
    },
    {
      code: "pt-BR",
      accessibleLabel: "Português",
    },
  ];

  const currentLabel = locale === "pt-BR" ? "PT-BR" : "EN";

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget as Node | null;

        if (
          !nextTarget ||
          !event.currentTarget.contains(nextTarget)
        ) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={`Selected language: ${currentLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 w-[88px] shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-0 text-xs font-bold text-white transition hover:border-purple-400/50 hover:bg-white/10"
      >
        {currentLabel}

        <svg
          className={`h-3 w-3 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Available languages"
          className="absolute right-0 top-full z-[60] min-w-28 overflow-hidden rounded-lg border border-white/10 bg-[#242424] py-2 shadow-2xl"
        >
          {options.map((option) => {
            const selected = locale === option.code;

            return (
              <button
                key={option.code}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                aria-label={option.accessibleLabel}
                onClick={() => {
                  onChange(option.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-5 px-4 py-3 text-left text-xs transition ${
                  selected
                    ? "bg-purple-500/15 font-bold text-purple-300"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{option.code === "pt-BR" ? "PT-BR" : "EN"}</span>

                {selected && (
                  <span className="text-purple-400">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const { locale, setLocale, dictionary } = useLanguage();

  const navigation = [
    { label: dictionary.navigation.home, href: "/" },
    { label: dictionary.navigation.members, href: "/members" },
    { label: dictionary.navigation.watch, href: "/watch" },
    { label: dictionary.navigation.about, href: "/#about" },
  ];

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/members") {
      return pathname.startsWith("/members");
    }

    if (href === "/watch") {
      return pathname.startsWith("/watch");
    }

    return false;
  }

  function linkClass(href: string) {
    const base =
      "block w-full whitespace-nowrap px-1 text-center text-sm font-medium transition-colors duration-200";

    return `${base} ${
      isActive(href)
        ? "text-purple-400"
        : "text-zinc-400 hover:text-white"
    }`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/95 text-white backdrop-blur-xl">

      {/* HEADER - FIXED RESPONSIVE GRID */}

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)]">

        {/* LOGO - LEFT */}

        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="shrink-0 text-xl font-black tracking-[0.18em] lg:justify-self-start"
        >
          MONSTER<span className="text-purple-400">.</span>
        </Link>

        {/* DESKTOP NAVIGATION - ALWAYS CENTERED */}

        <nav className="hidden w-[360px] grid-cols-4 items-center lg:grid lg:justify-self-center">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isActive(item.href) ? "page" : undefined
              }
              className={linkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT SIDE */}

        <div className="flex items-center gap-3 lg:justify-self-end">

          <span className="hidden whitespace-nowrap text-xs font-bold tracking-wider text-zinc-500 xl:block">
            {dictionary.navigation.globalArchive}
          </span>

          <LanguageSwitcher
            locale={locale}
            onChange={setLocale}
          />

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-label={
              menuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xl text-white transition hover:border-purple-400/50 hover:bg-white/10 lg:hidden"
          >
            {menuOpen ? "×" : "☰"}
          </button>

        </div>
      </div>

      {/* MOBILE NAVIGATION */}

      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#08090d] px-6 py-5 lg:hidden">

          <div className="mx-auto flex max-w-7xl flex-col gap-5">

            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={
                  isActive(item.href) ? "page" : undefined
                }
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-white/10 pt-4 text-[10px] font-bold tracking-widest text-zinc-600">
              {dictionary.navigation.globalArchive}
            </div>

          </div>
        </nav>
      )}

    </header>
  );
}
