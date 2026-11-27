"use client";

import { useState, type FormEvent } from "react";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { SOURCE_KINDS } from "@/lib/admin/news/model";
import { newsCopy } from "@/lib/admin/news/messages";
import type { DiscoverySource } from "@/lib/admin/editorial/model";
import type { EditorialCopy } from "@/lib/admin/editorial/messages";
import { Field, OriginalLink, buttonClass, inputClass, panelClass, primaryClass, timeLabel } from "./Controls";

type Props = {
  sources: DiscoverySource[];
  busy: boolean;
  copy: EditorialCopy;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
};

export default function Sources({ sources, busy, copy, onSave }: Props) {
  const { locale } = useAdminLocale();
  const c = copy.text;
  const [selected, setSelected] = useState<string | null>();
  const source = sources.find(item => item.id === selected);

  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold">{c.sources} <span className="text-sm font-normal text-zinc-400">({sources.length})</span></h2>
      <button type="button" className={primaryClass} disabled={busy} onClick={() => setSelected(null)}>{c.addSource}</button>
    </div>
    {selected !== undefined && <SourceForm key={source ? source.id + source.updated_at : "new"} source={source} c={c} busy={busy}
      onClose={() => setSelected(undefined)} onSave={async body => { if (await onSave(body)) setSelected(undefined); }} />}
    {!sources.length && <p className={panelClass + " text-sm text-zinc-400"}>{c.emptySources}</p>}
    <ul className="grid gap-3 xl:grid-cols-2">
      {sources.map(item => <li key={item.id} className={panelClass + " min-w-0"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words font-bold">{item.name}</h3>
            <p className="mt-1 text-xs text-zinc-400">{newsCopy(locale).sources[item.source_kind]} · {item.discovery_method === "manual" ? c.manual : item.discovery_method.toUpperCase()}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-500/20 text-zinc-300"}`}>{item.is_active ? c.active : c.inactive}</span>
        </div>
        <p className="mt-3 text-sm"><OriginalLink url={item.homepage_url}>{item.homepage_url}</OriginalLink></p>
        {item.discovery_method === "rss" && <p className="mt-2 text-xs text-zinc-400">{c.lastScan} · {item.last_scanned_at ? timeLabel(item.last_scanned_at, locale, true) + " UTC" : c.never}</p>}
        <button type="button" className={buttonClass + " mt-4"} disabled={busy} onClick={() => setSelected(item.id)}>{c.edit}</button>
      </li>)}
    </ul>
  </section>;
}

function SourceForm({ source, c, busy, onClose, onSave }: {
  source?: DiscoverySource; c: EditorialCopy["text"]; busy: boolean; onClose: () => void; onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const { locale } = useAdminLocale();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onSave({
      action: "save_source", id: source?.id ?? null, expectedUpdatedAt: source?.updated_at,
      fields: {
        name: data.get("name"), homepage_url: data.get("homepage"), feed_url: data.get("feed"),
        source_kind: data.get("kind"), is_active: data.has("active"),
      },
    });
  }
  return <form className={panelClass} onSubmit={submit}>
    <h3 className="mb-4 font-bold">{source ? c.editSource : c.addSource}</h3>
    <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <Field label={c.name}><input name="name" className={inputClass} defaultValue={source?.name} required maxLength={160} /></Field>
      <Field label={c.type}><select name="kind" className={inputClass} defaultValue={source?.source_kind ?? "manual"}>
        {SOURCE_KINDS.map(kind => <option key={kind} value={kind}>{newsCopy(locale).sources[kind]}</option>)}
      </select></Field>
      <Field label={c.homepage}><input name="homepage" className={inputClass} type="url" defaultValue={source?.homepage_url} required maxLength={2048} /></Field>
      <div>
        <Field label={c.feed}><input name="feed" className={inputClass} type="url" defaultValue={source?.feed_url ?? ""} maxLength={2048} /></Field>
        <p className="mt-1.5 text-xs text-zinc-400">{c.feedHint}</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300"><input name="active" type="checkbox" className="accent-purple-500" defaultChecked={source?.is_active ?? true} />{c.active}</label>
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
        <button type="button" className={buttonClass} onClick={onClose}>{c.cancel}</button>
        <button className={primaryClass}>{c.save}</button>
      </div>
    </fieldset>
  </form>;
}
