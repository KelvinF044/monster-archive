
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import { watchCollections } from "@/data/watch";

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
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          setOpen(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          setOpen(false);
        }
      }}
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
                <span>
                  {option.code === "pt-BR" ? "PT-BR" : "EN"}
                </span>

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
  const [watchMenuOpen, setWatchMenuOpen] = useState(false);
  const [mobileWatchOpen, setMobileWatchOpen] = useState(false);

  const { locale, setLocale, dictionary } = useLanguage();

  const navigation = [
    {
      label: dictionary.navigation.home,
      href: "/",
    },
    {
      label: dictionary.navigation.members,
      href: "/members",
    },
    {
      label: dictionary.navigation.watch,
      href: "/watch",
    },
    {
      label: dictionary.navigation.about,
      href: "/#about",
    },
  ];

  const categoryFilterKeys = {
    "Pre-debut": "preDebut",
    Stages: "stages",
    Variety: "variety",
    Behind: "behind",
    Events: "events",
    Awards: "awards",
  } as const;

  const watchCategoryLinks = watchCollections.map((collection) => ({
    slug: collection.slug,
    category: collection.category,
    label:
      dictionary.watch.filters[
        categoryFilterKeys[collection.category]
      ],
  }));

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

  function isCategoryActive(slug: string) {
    const categoryPath = `/watch/${slug}`;

    return (
      pathname === categoryPath ||
      pathname.startsWith(`${categoryPath}/`)
    );
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

  function closeMobileNavigation() {
    setMenuOpen(false);
    setMobileWatchOpen(false);
  }

  function closeWatchDropdown() {
    setWatchMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/95 text-white backdrop-blur-xl">

      {/* HEADER */}

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)]">

        {/* LOGO */}

        <Link
          href="/"
          onClick={closeMobileNavigation}
          className="shrink-0 text-xl font-black tracking-[0.18em] lg:justify-self-start"
        >
          MONSTER<span className="text-purple-400">.</span>
        </Link>

        {/* DESKTOP NAVIGATION */}

        <nav className="hidden h-full w-[360px] grid-cols-4 items-center lg:grid lg:justify-self-center">

          <Link
            href="/"
            aria-current={isActive("/") ? "page" : undefined}
            className={linkClass("/")}
          >
            {navigation[0].label}
          </Link>

          <Link
            href="/members"
            aria-current={
              isActive("/members") ? "page" : undefined
            }
            className={linkClass("/members")}
          >
            {navigation[1].label}
          </Link>

          {/* WATCH DROPDOWN */}

          <div
            className="relative flex h-full items-center justify-center"
            onMouseEnter={() => setWatchMenuOpen(true)}
            onMouseLeave={closeWatchDropdown}
            onFocusCapture={() => setWatchMenuOpen(true)}
            onBlur={(event) => {
              const nextTarget =
                event.relatedTarget as Node | null;

              if (
                !nextTarget ||
                !event.currentTarget.contains(nextTarget)
              ) {
                closeWatchDropdown();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeWatchDropdown();
              }
            }}
          >
            <Link
              href="/watch"
              aria-current={
                isActive("/watch") ? "page" : undefined
              }
              aria-haspopup="menu"
              aria-expanded={watchMenuOpen}
              aria-controls="desktop-watch-menu"
              className={linkClass("/watch")}
              onClick={closeWatchDropdown}
            >
              {navigation[2].label}
            </Link>

            {/* DESKTOP CATEGORY LIST */}

            <div
              className={`absolute left-1/2 top-full z-[70] w-48 -translate-x-1/2 pt-2 transition-all duration-200 ${
                watchMenuOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <div
                id="desktop-watch-menu"
                role="menu"
                aria-label="Watch categories"
                className="overflow-hidden rounded-lg border border-white/10 bg-[#08090d] py-2 shadow-2xl shadow-black/50"
              >
                {watchCategoryLinks.map((item) => {
                  const selected = isCategoryActive(item.slug);

                  return (
                    <Link
                      key={item.slug}
                      href={`/watch/${item.slug}`}
                      role="menuitem"
                      onClick={closeWatchDropdown}
                      className={`block px-4 py-3 text-left text-xs transition ${
                        selected
                          ? "bg-purple-500/25 font-bold text-white"
                          : "text-white/80 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <Link
            href="/#about"
            className={linkClass("/#about")}
          >
            {navigation[3].label}
          </Link>

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
            onClick={() => {
              setMenuOpen((previous) => !previous);
              setMobileWatchOpen(false);
            }}
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

            <Link
              href="/"
              onClick={closeMobileNavigation}
              aria-current={isActive("/") ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${
                isActive("/")
                  ? "text-purple-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {navigation[0].label}
            </Link>

            <Link
              href="/members"
              onClick={closeMobileNavigation}
              aria-current={
                isActive("/members") ? "page" : undefined
              }
              className={`text-sm font-medium transition-colors ${
                isActive("/members")
                  ? "text-purple-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {navigation[1].label}
            </Link>

            {/* MOBILE WATCH */}

            <div className="flex flex-col gap-3">

              <div className="flex items-center justify-between gap-4">

                <Link
                  href="/watch"
                  onClick={closeMobileNavigation}
                  aria-current={
                    isActive("/watch") ? "page" : undefined
                  }
                  className={`text-sm font-medium transition-colors ${
                    isActive("/watch")
                      ? "text-purple-400"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {navigation[2].label}
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setMobileWatchOpen((previous) => !previous)
                  }
                  aria-label={
                    locale === "pt-BR"
                      ? "Abrir categorias de vídeos"
                      : "Open Watch categories"
                  }
                  aria-expanded={mobileWatchOpen}
                  aria-controls="mobile-watch-categories"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:border-purple-400/50 hover:text-white"
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      mobileWatchOpen ? "rotate-180" : ""
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

              </div>

              {/* MOBILE CATEGORY LIST - NO CONTAINER */}

              {mobileWatchOpen && (
                <div
                  id="mobile-watch-categories"
                  className="flex flex-col py-1"
                >
                  {watchCategoryLinks.map((item) => {
                    const selected = isCategoryActive(item.slug);

                    return (
                      <Link
                        key={item.slug}
                        href={`/watch/${item.slug}`}
                        onClick={closeMobileNavigation}
                        className={`block rounded-md px-4 py-3 text-xs transition ${
                          selected
                            ? "bg-purple-500/25 font-bold text-white"
                            : "text-white/80 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}

            </div>

            <Link
              href="/#about"
              onClick={closeMobileNavigation}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {navigation[3].label}
            </Link>

            <div className="border-t border-white/10 pt-4 text-[10px] font-bold tracking-widest text-zinc-600">
              {dictionary.navigation.globalArchive}
            </div>

          </div>
        </nav>
      )}

    </header>
  );
}
