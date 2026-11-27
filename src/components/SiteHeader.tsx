
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

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

type NavigationLink = {
  href: string;
  label: string;
};

type NavigationItem = NavigationLink & {
  id: string;
  children?: NavigationLink[];
};

function matchesPath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : !href.includes("#") && (pathname === href || pathname.startsWith(href + "/"));
}

function DesktopNavigationItem({
  item,
  pathname,
  open,
  onOpenChange,
}: {
  item: NavigationItem;
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const active =
    matchesPath(pathname, item.href) ||
    Boolean(item.children?.some((entry) => matchesPath(pathname, entry.href)));

  const linkClass = `block w-full whitespace-nowrap px-1 text-center text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400 ${
    active ? "text-purple-400" : "text-zinc-400 hover:text-white"
  }`;

  if (!item.children?.length) {
    return (
      <Link href={item.href} className={linkClass} aria-current={pathname === item.href ? "page" : undefined}>
        {item.label}
      </Link>
    );
  }

  const id = `desktop-${item.id}-menu`;

  return (
    <div
      className="relative flex h-full items-center justify-center"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) onOpenChange(false);
      }}
      onFocusCapture={() => onOpenChange(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onOpenChange(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          triggerRef.current?.focus();
          onOpenChange(false);
        }
      }}
    >
      <Link
        ref={triggerRef}
        href={item.href}
        aria-current={pathname === item.href ? "page" : undefined}
        aria-expanded={open}
        aria-controls={id}
        className={linkClass}
        onClick={() => onOpenChange(false)}
      >
        {item.label}
      </Link>
      <div
        className={`absolute left-1/2 top-full z-[70] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-2 transition-all duration-200 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <ul
          id={id}
          aria-label={item.label}
          className="overflow-hidden rounded-lg border border-white/10 bg-[#08090d] py-1 shadow-2xl shadow-black/50"
        >
          {item.children.map((entry) => {
            const selected = matchesPath(pathname, entry.href);
            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  aria-current={pathname === entry.href ? "page" : undefined}
                  onClick={() => onOpenChange(false)}
                  className={`block whitespace-nowrap px-5 py-2.5 text-center text-xs transition focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-purple-400 ${
                    selected
                      ? "bg-purple-500/25 font-bold text-white"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function SiteHeader({
  memberLinks,
}: {
  memberLinks: { slug: string; name: string }[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopGroup, setDesktopGroup] = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const { locale, setLocale, dictionary } = useLanguage();

  const categoryFilterKeys = {
    MV: "musicVideos",
    "Pre-debut": "preDebut",
    Stages: "stages",
    Variety: "variety",
    Behind: "behind",
    Events: "events",
    Awards: "awards",
  } as const;

  const navigation: NavigationItem[] = [
    {
      id: "home",
      label: dictionary.navigation.home,
      href: "/",
      children: [
        { label: dictionary.navigation.news, href: "/news" },
        { label: dictionary.navigation.events, href: "/schedule" },
      ],
    },
    {
      id: "members",
      label: dictionary.navigation.members,
      href: "/members",
      children: memberLinks.map((member) => ({
        label: member.name,
        href: `/members/${member.slug}`,
      })),
    },
    {
      id: "watch",
      label: dictionary.navigation.watch,
      href: "/watch",
      children: watchCollections.map((collection) => ({
        href: `/watch/${collection.slug}`,
        label: dictionary.watch.filters[categoryFilterKeys[collection.category]],
      })),
    },
    {
      id: "about",
      label: dictionary.navigation.about,
      href: "/about",
    },
  ];

  function closeMobileNavigation() {
    setMenuOpen(false);
    setMobileGroup(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)]">
        <Link
          href="/"
          onClick={closeMobileNavigation}
          className="shrink-0 text-xl font-black tracking-[0.18em] lg:justify-self-start"
        >
          MONSTER<span className="text-purple-400">.</span>
        </Link>

        <nav
          aria-label={locale === "pt-BR" ? "Navegação principal" : "Main navigation"}
          className="hidden h-full w-[360px] grid-cols-4 items-center lg:grid lg:justify-self-center"
        >
          {navigation.map((item) => (
            <DesktopNavigationItem
              key={item.id}
              item={item}
              pathname={pathname}
              open={desktopGroup === item.id}
              onOpenChange={(open) =>
                setDesktopGroup((current) => open ? item.id : current === item.id ? null : current)
              }
            />
          ))}
        </nav>

        <div className="flex items-center gap-3 lg:justify-self-end">
          <span className="hidden whitespace-nowrap text-xs font-bold tracking-wider text-zinc-500 xl:block">
            {dictionary.navigation.globalArchive}
          </span>
          <LanguageSwitcher locale={locale} onChange={setLocale} />
          <button
            type="button"
            onClick={() => {
              setMenuOpen((previous) => !previous);
              setMobileGroup(null);
            }}
            aria-label={locale === "pt-BR"
              ? (menuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação")
              : (menuOpen ? "Close navigation menu" : "Open navigation menu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-site-navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xl text-white transition hover:border-purple-400/50 hover:bg-white/10 lg:hidden"
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-site-navigation"
          aria-label={locale === "pt-BR" ? "Navegação principal" : "Main navigation"}
          className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-white/10 bg-[#08090d] px-6 py-5 lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {navigation.map((item) => {
              const expanded = mobileGroup === item.id;
              const active = matchesPath(pathname, item.href) ||
                item.children?.some((entry) => matchesPath(pathname, entry.href));
              const groupId = `mobile-${item.id}-menu`;
              return (
                <div key={item.id}>
                  <div className="flex min-h-9 items-center justify-between gap-4">
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      onClick={closeMobileNavigation}
                      className={`text-sm font-medium transition-colors ${active ? "text-purple-400" : "text-zinc-400 hover:text-white"}`}
                    >
                      {item.label}
                    </Link>
                    {!!item.children?.length && (
                      <button
                        type="button"
                        onClick={() => setMobileGroup((current) => current === item.id ? null : item.id)}
                        aria-expanded={expanded}
                        aria-controls={groupId}
                        aria-label={locale === "pt-BR" ? `${expanded ? "Recolher" : "Expandir"} ${item.label}` : `${expanded ? "Collapse" : "Expand"} ${item.label}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:border-purple-400/50 hover:text-white"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
                          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {item.children && (
                    <ul id={groupId} hidden={!expanded} className="mt-2 w-fit max-w-full rounded-lg border border-white/10 py-1">
                      {item.children.map((entry) => (
                        <li key={entry.href}>
                          <Link
                            href={entry.href}
                            aria-current={pathname === entry.href ? "page" : undefined}
                            onClick={closeMobileNavigation}
                            className={`block whitespace-nowrap px-5 py-2.5 text-center text-xs transition ${
                              matchesPath(pathname, entry.href)
                                ? "bg-purple-500/25 font-bold text-white"
                                : "text-white/80 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {entry.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            <div className="border-t border-white/10 pt-4 text-[10px] font-bold tracking-widest text-zinc-600">
              {dictionary.navigation.globalArchive}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
