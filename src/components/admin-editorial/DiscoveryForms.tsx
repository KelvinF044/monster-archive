"use client";

import type { FormEvent } from "react";
import { CANDIDATE_KINDS, DEFAULT_BAND_FILTER, type DiscoverySource } from "@/lib/admin/editorial/model";
import type { EditorialCopy } from "@/lib/admin/editorial/messages";
import { Field, inputClass, panelClass, primaryClass } from "./Controls";

export default function DiscoveryForms({ sources, copy, busy, submit }: {
  sources: DiscoverySource[]; copy: EditorialCopy; busy: boolean;
  submit: (input: Record<string, unknown>) => Promise<boolean>;
}) {
  const c = copy.text;
  const active = sources.filter(source => source.is_active);
  const feeds = active.filter(source => source.discovery_method === "rss" && source.feed_url);

  function handle(event: FormEvent<HTMLFormElement>, action: "scan" | "add_candidate") {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const base = { action, sourceId: data.get("source"), kind: data.get("kind") };
    if (action === "scan") {
      void submit({ ...base, term: data.get("term") });
      return;
    }
    const date = data.get("date");
    void submit({
      ...base,
      fields: {
        source_url: data.get("url"), original_title: data.get("title"), original_excerpt: data.get("excerpt"),
        original_language: data.get("language"), source_published_at: date ? `${date}T00:00:00Z` : "", external_id: "",
      },
    }).then(saved => { if (saved) form.reset(); });
  }

  const sourceField = (eligible: DiscoverySource[]) => <Field label={c.source}>
    <select className={inputClass} name="source" required defaultValue="">
      <option value="" disabled>{c.selectSource}</option>
      {eligible.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
    </select>
  </Field>;
  const kindField = <Field label={c.kind}><select className={inputClass} name="kind">
    {CANDIDATE_KINDS.map(kind => <option key={kind} value={kind}>{copy.kinds[kind]}</option>)}
  </select></Field>;

  return <div className="grid items-start gap-3 xl:grid-cols-2">
    <details className={panelClass}>
      <summary className="cursor-pointer font-bold">{c.discover}</summary>
      {feeds.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{c.noFeeds}</p> :
        <form onSubmit={event => handle(event, "scan")} className="mt-4">
          <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2" disabled={busy}>
            {sourceField(feeds)}{kindField}
            <div className="sm:col-span-2">
              <Field label={c.term}><input className={inputClass} name="term" defaultValue={DEFAULT_BAND_FILTER} maxLength={100} /></Field>
              <p className="mt-1.5 text-xs text-zinc-400">{c.termHint}</p>
            </div>
            <button className={primaryClass + " justify-self-start sm:col-span-2"}>{c.scan}</button>
          </fieldset>
        </form>}
    </details>
    <details className={panelClass}>
      <summary className="cursor-pointer font-bold">{c.addManual}</summary>
      {active.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{c.emptySources}</p> :
        <form onSubmit={event => handle(event, "add_candidate")} className="mt-4">
          <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2" disabled={busy}>
            {sourceField(active)}{kindField}
            <div className="sm:col-span-2"><Field label={c.title}><input name="title" className={inputClass} required maxLength={250} /></Field></div>
            <div className="sm:col-span-2"><Field label={c.url}><input name="url" className={inputClass} type="url" required maxLength={2048} /></Field></div>
            <div className="sm:col-span-2"><Field label={c.excerpt}><textarea name="excerpt" className={inputClass} rows={2} maxLength={500} /></Field></div>
            <Field label={c.language}><input name="language" className={inputClass} placeholder="pt-BR" maxLength={35} /></Field>
            <Field label={c.sourceDate}><input name="date" className={inputClass} type="date" min="1900-01-01" max="9998-12-31" /></Field>
            <button className={primaryClass + " justify-self-start sm:col-span-2"}>{c.add}</button>
          </fieldset>
        </form>}
    </details>
  </div>;
}
