
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Members", href: "/members" },
  { label: "Watch", href: "/watch" },
  { label: "About", href: "/#about" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/members") return pathname.startsWith("/members");
    if (href === "/watch") return pathname.startsWith("/watch");
    return false;
  }

  function linkClass(href: string) {
    const base =
      "text-sm font-medium transition-colors duration-200";

    return `${base} ${
      isActive(href)
        ? "text-purple-400"
        : "text-zinc-400 hover:text-white"
    }`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/95 text-white backdrop-blur-xl">

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* LOGO */}

        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="text-2xl font-black tracking-[0.18em]"
        >
          MONSTER<span className="text-purple-400">.</span>
        </Link>

        {/* DESKTOP NAVIGATION */}

        <nav className="hidden items-center gap-9 md:flex">

          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={linkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}

        </nav>

        {/* DESKTOP INFORMATION */}

        <span className="hidden text-xs font-bold tracking-wider text-zinc-500 lg:block">
          GLOBAL FAN ARCHIVE
        </span>

        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-xl text-white transition hover:bg-white/10 md:hidden"
        >
          {menuOpen ? "×" : "☰"}
        </button>

      </div>

      {/* MOBILE NAVIGATION */}

      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#08090d] px-6 py-5 md:hidden">

          <div className="mx-auto flex max-w-7xl flex-col gap-5">

            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={linkClass(item.href)}
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-white/10 pt-4 text-[10px] font-bold tracking-widest text-zinc-600">
              GLOBAL FAN ARCHIVE
            </div>

          </div>

        </nav>
      )}

    </header>
  );
}
