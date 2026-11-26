"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { editorialAdminCopy, type EditorialError } from "@/lib/admin/editorial/messages";
import { QUEUE_PAGE_SIZE, type DiscoverySource, type Queue as QueueData, type ScanResult } from "@/lib/admin/editorial/model";
import { buttonClass, primaryClass } from "./Controls";
import Sources from "./Sources";
import NewsDiscovery from "./NewsDiscovery";
import DiscoveryForms from "./DiscoveryForms";
import { Queue, type Filters } from "./Queue";

type Workspace = { sources: DiscoverySource[]; queue: QueueData };
type Props = Workspace & { failed: boolean };
type Message = "candidateSaved" | "sourceSaved" | "reviewSaved";

class EditorialApiError extends Error {
  constructor(public code: EditorialError) { super(code); }
}

async function request<T>(params?: URLSearchParams, input?: Record<string, unknown>) {
  const query = params ? "?" + params.toString() : "";
  const response = await fetch("/api/admin/editorial" + query, input
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }
    : { cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new EditorialApiError(data?.error ?? "database_error");
  return data as T;
}

export default function AdminEditorialCenter({ sources, queue, failed }: Props) {
  const { locale, t } = useAdminLocale();
  const copy = editorialAdminCopy(locale), c = copy.text;
  const [selectedTab, setSelectedTab] = useState<"sources" | "queue">("queue");
  const [workspace, setWorkspace] = useState<Workspace>({ sources, queue });
  const [filters, setFilters] = useState<Filters>({ q: "", kind: "", status: "", source: "" });
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState<EditorialError | null>(failed ? "database_error" : null);
  const [message, setMessage] = useState<Message | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);

  async function fetchWorkspace(current: Filters, page: number) {
    const params = new URLSearchParams({ ...current, page: String(page) });
    const result = await request<Workspace>(params);
    const last = Math.max(1, Math.ceil(result.queue.total / QUEUE_PAGE_SIZE));
    if (page <= last) return result;
    params.set("page", String(last));
    return request<Workspace>(params);
  }

  async function run(task: () => Promise<void>) {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    setScan(null);
    try {
      await task();
      return true;
    } catch (cause) {
      setError(cause instanceof EditorialApiError ? cause.code : "database_error");
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  function load(next: Filters, page: number) {
    void run(async () => {
      setWorkspace(await fetchWorkspace(next, page));
      setFilters(next);
    });
  }

  async function submit(input: Record<string, unknown>) {
    let saved = false;
    await run(async () => {
      const action = input.action;
      let result: ScanResult;
      try {
        result = await request<ScanResult>(undefined, input);
      } catch (cause) {
        if (cause instanceof EditorialApiError && cause.code === "scan_partial") {
          const refreshed = await fetchWorkspace(filters, 1).catch(() => null);
          if (refreshed) setWorkspace(refreshed);
        }
        throw cause;
      }
      saved = true;
      if (action === "scan" || action === "discover_news") setScan(result);
      else setMessage(action === "save_source" ? "sourceSaved" : action === "curate" ? "reviewSaved" : "candidateSaved");
      const showNew = action === "discover_news" && result.added > 0;
      const next = showNew ? { q: "", kind: "news", status: "pending", source: "" } : filters;
      const page = action === "add_candidate" || action === "scan" || action === "discover_news" ? 1 : workspace.queue.page;
      setWorkspace(await fetchWorkspace(next, page));
      if (showNew) setFilters(next);
    });
    return saved;
  }

  return <main className="min-h-screen bg-[#08090d] px-5 py-10 text-white md:px-6 md:py-12">
    <div className="mx-auto max-w-7xl">
      <header className="border-b border-white/10 pb-7">
        <Link href="/admin" className="text-xs font-bold text-zinc-400 hover:text-white">{t("← BACK TO DASHBOARD")}</Link>
        <h1 className="mt-5 text-4xl font-black">{c.heading}<span className="text-purple-400">.</span></h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{c.intro}</p>
      </header>
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={c.heading} className="flex flex-wrap gap-2">
          {(["queue", "sources"] as const).map(tab => <button type="button" key={tab}
            className={selectedTab === tab ? primaryClass : buttonClass} aria-pressed={selectedTab === tab}
            disabled={busy} onClick={() => setSelectedTab(tab)}>{c[tab]}</button>)}
        </nav>
        <button type="button" disabled={busy} onClick={() => load(filters, workspace.queue.page)} className={buttonClass}>
          {busy ? c.busy : c.refresh}
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
        {Object.hasOwn(c, error) ? c[error] : c.database_error}
      </p>}
      {(message || scan) && <div role="status" className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-200">
        {message && c[message]}
        {scan && <>
          <p>{c.matches} {scan.matches} · {c.added} {scan.added} · {c.duplicates} {scan.duplicates}</p>
          {scan.truncated && <p className="mt-1">{c.scanLimit}</p>}
          {!!scan.failures && <p className="mt-1 text-amber-300">{c.scanFailures} {scan.failures}</p>}
        </>}
      </div>}
      {selectedTab === "sources"
        ? <Sources sources={workspace.sources} busy={busy} copy={copy} onSave={submit} />
        : <div className="space-y-6">
          <NewsDiscovery sources={workspace.sources} busy={busy} submit={submit} />
          <DiscoveryForms sources={workspace.sources} busy={busy} copy={copy} submit={submit} />
          <Queue queue={workspace.queue} sources={workspace.sources} filters={filters} copy={copy} busy={busy} load={load} submit={submit} />
        </div>}
    </div>
  </main>;
}
