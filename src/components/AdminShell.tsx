"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import AdminLogoutButton from "@/components/AdminLogoutButton";
import { useAdminText } from "@/components/useAdminText";

type NavItem = {
  href: string;
  label: string;
  compactLabel: string;
  description: string;
  match: (pathname: string) => boolean;
};

type NavGroup = {
  id: string;
  label: string;
  compactLabel: string;
  description: string;
  items: NavItem[];
};

type NavEntry = NavItem | NavGroup;

const navigation: NavEntry[] = [
  {
    href: "/admin",
    label: "Dashboard",
    compactLabel: "D",
    description: "Archive overview",
    match: (pathname) => pathname === "/admin",
  },
  {
    id: "watch",
    label: "Watch",
    compactLabel: "W",
    description: "Manage the audiovisual archive",
    items: [
      {
        href: "/admin/videos",
        label: "Watch Videos",
        compactLabel: "W",
        description: "Browse and edit registered videos",
        match: (pathname) =>
          pathname === "/admin/videos" ||
          (pathname.startsWith("/admin/videos/") &&
            pathname !== "/admin/videos/new"),
      },
      {
        href: "/admin/videos/new",
        label: "Add New Video",
        compactLabel: "+",
        description: "Register a new video",
        match: (pathname) => pathname === "/admin/videos/new",
      },
      {
        href: "/admin/import",
        label: "Content Import Center",
        compactLabel: "I",
        description: "Discover and review YouTube playlist videos",
        match: (pathname) => pathname.startsWith("/admin/import"),
      },
      {
        href: "/admin/eras",
        label: "Era Management",
        compactLabel: "E",
        description: "Manage the central era catalog",
        match: (pathname) => pathname.startsWith("/admin/eras"),
      },
    ],
  },
  {
    href: "/admin/visual",
    label: "Visual Studio",
    compactLabel: "V",
    description: "Manage website images and visual assets",
    match: (pathname) => pathname.startsWith("/admin/visual"),
  },
  {
    href: "/admin/news",
    label: "News",
    compactLabel: "N",
    description: "Manage archive news",
    match: (pathname) => pathname === "/admin/news" || pathname.startsWith("/admin/news/"),
  },
  {
    href: "/admin/schedule",
    label: "Events",
    compactLabel: "EV",
    description: "Manage the official schedule",
    match: (pathname) => pathname === "/admin/schedule" || pathname.startsWith("/admin/schedule/"),
  },
  {
    href: "/admin/editorial",
    label: "Editorial",
    compactLabel: "ED",
    description: "Manage sources and editorial review",
    match: (pathname) => pathname === "/admin/editorial" || pathname.startsWith("/admin/editorial/"),
  },
];

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const t = useAdminText();
  const [collapsed, setCollapsed] = useState(false);
  const [groupOverrides, setGroupOverrides] = useState<{
    pathname: string;
    groups: Record<string, boolean>;
  }>({ pathname, groups: {} });

  function setGroupOpen(id: string, open: boolean) {
    setGroupOverrides((current) => ({
      pathname,
      groups: {
        ...(current.pathname === pathname ? current.groups : {}),
        [id]: open,
      },
    }));
  }

  function linkItem(item: NavItem, nested = false) {
    const active = item.match(pathname);

    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? t(item.label) : undefined}
        aria-label={t(item.label)}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          if (window.matchMedia("(max-width: 767px)").matches) {
            setCollapsed(true);
          }
        }}
        className={`group flex min-h-11 items-center gap-3 rounded-lg transition ${
          collapsed ? "justify-center px-1" : nested ? "px-2" : "px-3"
        } ${
          active
            ? "border border-purple-400/20 bg-purple-500/15 text-white"
            : "border border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
        }`}
      >
        {!nested && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-black transition ${
            active
              ? "bg-purple-500 text-white"
              : "bg-white/[0.06] text-zinc-400 group-hover:bg-white/10 group-hover:text-white"
          }`}>
            {item.compactLabel}
          </span>
        )}
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold">{t(item.label)}</span>
            <span className="mt-1 block truncate text-[10px] text-zinc-600">{t(item.description)}</span>
          </span>
        )}
        {!collapsed && active && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
        )}
      </Link>
    );
  }

  // Keep the authentication screen focused and free of admin navigation.
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <div
      className={`min-h-screen transition-[padding] duration-300 ${
        collapsed ? "md:pr-16" : "md:pr-[284px]"
      }`}
    >
      {children}

      {!collapsed && (
        <button
          type="button"
          aria-label={t("Close admin navigation")}
          onClick={() => setCollapsed(true)}
          className="fixed inset-x-0 bottom-0 top-20 z-40 bg-black/65 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        aria-label={t("Admin navigation")}
        className={`fixed right-0 top-20 z-[45] flex h-[calc(100dvh-5rem)] flex-col border-l border-white/10 bg-[#0d0e13] text-white shadow-2xl transition-[width] duration-300 ${
          collapsed ? "w-14" : "w-[min(84vw,276px)]"
        }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? t("Expand admin navigation") : t("Collapse admin navigation")}
          aria-expanded={!collapsed}
          title={collapsed ? t("Expand navigation") : t("Collapse navigation")}
          className="absolute -left-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-purple-400/40 bg-[#171820] text-purple-300 shadow-xl transition hover:border-purple-300 hover:bg-purple-500 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-transform duration-300 ${
              collapsed ? "" : "rotate-180"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m14 18-6-6 6-6" />
          </svg>
        </button>

        <div className={`border-b border-white/10 px-4 py-5 ${
          collapsed ? "px-2 text-center" : ""
        }`}>
          {collapsed ? (
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-sm font-black text-purple-300">
              M.
            </span>
          ) : (
            <>
              <p className="text-sm font-black tracking-[0.16em]">
                MONSTER<span className="text-purple-400">.</span>
              </p>
              <p className="mt-2 text-[10px] font-bold tracking-[0.24em] text-zinc-500">
                {t("ADMIN WORKSPACE")}
              </p>
            </>
          )}
        </div>

        <nav className={`flex-1 space-y-2 overflow-y-auto py-5 ${
          collapsed ? "px-2" : "px-3"
        }`}>
          {!collapsed && (
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.2em] text-zinc-600">
              {t("WORKSPACE")}
            </p>
          )}

          {navigation.map((entry) => {
            if (!isGroup(entry)) return linkItem(entry);

            const active = entry.items.some((item) => item.match(pathname));
            const override = groupOverrides.pathname === pathname
              ? groupOverrides.groups[entry.id]
              : undefined;
            const expanded = !collapsed && (override ?? active);
            const groupId = `admin-navigation-${entry.id}`;

            return (
              <div key={entry.id}>
                <button
                  type="button"
                  title={collapsed ? t(entry.label) : undefined}
                  aria-label={t(entry.label)}
                  aria-expanded={expanded}
                  aria-controls={groupId}
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setGroupOpen(entry.id, true);
                    } else {
                      setGroupOpen(entry.id, !expanded);
                    }
                  }}
                  className={`group flex min-h-11 w-full items-center gap-3 rounded-lg border text-left transition ${
                    collapsed ? "justify-center px-1" : "px-3"
                  } ${
                    active
                      ? "border-purple-400/20 bg-purple-500/15 text-white"
                      : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-black ${
                    active ? "bg-purple-500 text-white" : "bg-white/[0.06] text-zinc-400 group-hover:text-white"
                  }`}>
                    {entry.compactLabel}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold">{t(entry.label)}</span>
                        <span className="mt-1 block truncate text-[10px] text-zinc-600">{t(entry.description)}</span>
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
                        className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </>
                  )}
                </button>
                <div id={groupId} hidden={!expanded}>
                  {expanded && (
                    <div className="ml-7 mt-1 space-y-1 border-l border-white/10 pl-2">
                      {entry.items.map((item) => linkItem(item, true))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        <div className={`border-t border-white/10 p-3 ${
          collapsed ? "flex justify-center px-2" : ""
        }`}>
          {!collapsed && (
            <Link
              href="/"
              className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-[10px]">
                ↗
              </span>
              {t("View public website")}
            </Link>
          )}

          <AdminLogoutButton compact={collapsed} />
        </div>
      </aside>
    </div>
  );
}
