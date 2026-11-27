"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { CANDIDATE_KINDS, CANDIDATE_STATUSES, QUEUE_PAGE_SIZE, type Candidate, type CandidateStatus, type DiscoverySource, type Queue as QueueData } from "@/lib/admin/editorial/model";
import type { EditorialCopy } from "@/lib/admin/editorial/messages";
import EditorialAssist from "./Assist";
import { Field, OriginalLink, buttonClass, inputClass, panelClass, primaryClass, timeLabel } from "./Controls";

export type Filters = { q: string; kind: string; status: string; source: string };
const emptyFilters: Filters = { q: "", kind: "", status: "", source: "" };
const statusClass: Record<CandidateStatus, string> = {
  pending: "bg-amber-500/10 text-amber-300",
  in_review: "bg-sky-500/10 text-sky-300",
  accepted: "bg-emerald-500/10 text-emerald-300",
  rejected: "bg-red-500/10 text-red-300",
  duplicate: "bg-zinc-500/15 text-zinc-300",
};

type Props = {
  sources: DiscoverySource[];
  queue: QueueData;
  filters: Filters;
  copy: EditorialCopy;
  busy: boolean;
  load: (filters: Filters, page: number) => void;
  submit: (input: Record<string, unknown>) => Promise<boolean>;
};

export function Queue({ queue, filters, sources, copy, busy, load, submit }: Props) {
  const { locale } = useAdminLocale();
  const c = copy.text;
  const [selected, setSelected] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(queue.total / QUEUE_PAGE_SIZE));

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = { ...emptyFilters };
    for (const name of Object.keys(next) as (keyof Filters)[]) next[name] = String(data.get(name) ?? "");
    load(next, 1);
  }

  return <section className="space-y-4">
    <h2 className="text-xl font-bold">{c.queue} <span className="text-sm font-normal text-zinc-400">({queue.total})</span></h2>
    <form key={JSON.stringify(filters)} className={panelClass + " grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto]"} onSubmit={filter}>
      <Field label={c.search}><input name="q" defaultValue={filters.q} className={inputClass} maxLength={100} /></Field>
      <Field label={c.status}><select name="status" className={inputClass} defaultValue={filters.status}>
        <option value="">{c.all}</option>{CANDIDATE_STATUSES.map(status => <option key={status} value={status}>{copy.statuses[status]}</option>)}
      </select></Field>
      <Field label={c.kind}><select name="kind" className={inputClass} defaultValue={filters.kind}>
        <option value="">{c.all}</option>{CANDIDATE_KINDS.map(kind => <option key={kind} value={kind}>{copy.kinds[kind]}</option>)}
      </select></Field>
      <Field label={c.source}><select name="source" className={inputClass} defaultValue={filters.source}>
        <option value="">{c.all}</option>{sources.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
      </select></Field>
      <button type="submit" disabled={busy} className={primaryClass}>{c.filter}</button>
    </form>
    {!queue.candidates.length && <p className={panelClass + " text-sm text-zinc-400"}>{c.empty}</p>}
    <ul className="space-y-3">
      {queue.candidates.map(candidate => {
        const source = sources.find(item => item.id === candidate.source_id);
        const open = selected === candidate.id;
        return <li key={candidate.id} className={panelClass + " min-w-0"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 basis-56">
              <p className="mb-1 break-words text-xs font-semibold text-zinc-400">
                {copy.kinds[candidate.kind]} · {source?.name ?? c.source} · {timeLabel(candidate.source_published_at, locale) || c.noDate}
                {candidate.original_language && " · " + candidate.original_language}
              </p>
              <h3 className="break-words font-bold">{candidate.original_title}</h3>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[candidate.status]}`}>{copy.statuses[candidate.status]}</span>
            <button type="button" disabled={busy} className={buttonClass} aria-expanded={open}
              onClick={() => setSelected(open ? null : candidate.id)}>{open ? c.close : c.review}</button>
          </div>
          {open && <Review key={candidate.updated_at} candidate={candidate} copy={copy} busy={busy}
            save={async input => { if (await submit(input)) setSelected(null); }} />}
        </li>;
      })}
    </ul>
    {pages > 1 && <nav aria-label={c.queue} className="flex flex-wrap items-center justify-end gap-3 text-sm text-zinc-400">
      <button type="button" className={buttonClass} disabled={busy || queue.page <= 1} onClick={() => load(filters, queue.page - 1)}>{c.previous}</button>
      <span>{queue.page} / {pages}</span>
      <button type="button" className={buttonClass} disabled={busy || queue.page >= pages} onClick={() => load(filters, queue.page + 1)}>{c.next}</button>
    </nav>}
  </section>;
}

function Review({ candidate, copy, busy, save }: {
  candidate: Candidate; copy: EditorialCopy; busy: boolean; save: (input: Record<string, unknown>) => Promise<void>;
}) {
  const c = copy.text;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void save({ action: "curate", id: candidate.id, expectedUpdatedAt: candidate.updated_at, status: data.get("status"), note: data.get("note") });
  }

  return <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
    {candidate.original_excerpt && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">{candidate.original_excerpt}</p>}
    <p className="text-sm"><OriginalLink url={candidate.source_url}>{c.open}</OriginalLink></p>
    <form onSubmit={submit}>
      <fieldset className="grid min-w-0 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]" disabled={busy}>
        <Field label={c.status}><select name="status" className={inputClass} defaultValue={candidate.status}>
          {CANDIDATE_STATUSES.map(status => <option key={status} value={status}>{copy.statuses[status]}</option>)}
        </select></Field>
        <Field label={c.note}><textarea name="note" rows={2} maxLength={1500} className={inputClass} defaultValue={candidate.editorial_note ?? ""} /></Field>
        <button className={primaryClass}>{c.save}</button>
      </fieldset>
    </form>
    {(candidate.status === "accepted" || candidate.draft_news_id || candidate.draft_event_id) && <EditorialAssist candidate={candidate} disabled={busy} />}
    {candidate.status === "accepted" && <p className="text-sm text-zinc-400">
      {c.acceptedHint}{" "}
      <Link href={candidate.kind === "news" ? "/admin/news" : "/admin/schedule"} className="font-semibold text-purple-300 hover:underline">
        {candidate.kind === "news" ? c.goNews : c.goEvents} →
      </Link>
    </p>}
  </div>;
}
