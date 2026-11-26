"use client";

import { useState, type FormEvent } from "react";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import type { DiscoverySource } from "@/lib/admin/editorial/model";
import { NEWS_PROVIDERS, type NewsProvider } from "@/lib/admin/editorial/publishers";
import { Field, inputClass, panelClass, primaryClass } from "./Controls";

export default function NewsDiscovery({ sources, busy, submit }: {
  sources: DiscoverySource[];
  busy: boolean;
  submit: (input: Record<string, unknown>) => Promise<boolean>;
}) {
  const { locale } = useAdminLocale();
  const pt = locale === "pt-BR";
  const [provider, setProvider] = useState<NewsProvider>("yg");
  const feeds = sources.filter(source => source.is_active && source.discovery_method === "rss" && source.feed_url);
  const labels: Record<NewsProvider, string> = {
    yg: pt ? "YG Entertainment (oficial)" : "YG Entertainment (official)",
    "korea-herald": "The Korea Herald (K-pop)",
    "korea-times": pt ? "The Korea Times (entretenimento)" : "The Korea Times (entertainment)",
    x: pt ? "X (aparições públicas)" : "X (public appearances)",
    rss: pt ? "RSS ou Atom cadastrado" : "Registered RSS or Atom",
  };

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void submit({ action: "discover_news", provider, ...(provider === "rss" ? { sourceId: data.get("sourceId") } : {}) });
  }

  return <details className={panelClass}>
    <summary className="cursor-pointer font-bold text-purple-200">{pt ? "Buscar notícias" : "Find news"}</summary>
    <form className="mt-4" onSubmit={search}>
      <fieldset disabled={busy} className="grid min-w-0 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Field label={pt ? "Onde buscar" : "Where to search"}>
          <select className={inputClass} value={provider} onChange={event => setProvider(event.target.value as NewsProvider)}>
            {NEWS_PROVIDERS.map(value => <option key={value} value={value}>{labels[value]}</option>)}
          </select>
        </Field>
        {provider === "rss" && <Field label={pt ? "Fonte cadastrada" : "Registered source"}>
          <select className={inputClass} name="sourceId" required defaultValue="">
            <option value="" disabled>{pt ? "Selecione uma fonte" : "Select a source"}</option>
            {feeds.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>
        </Field>}
        <button type="submit" className={primaryClass} disabled={provider === "rss" && feeds.length === 0}>
          {busy ? (pt ? "Buscando…" : "Searching…") : (pt ? "Buscar BABYMONSTER" : "Find BABYMONSTER")}
        </button>
      </fieldset>
      {provider === "x" && <p className="mt-3 text-sm text-zinc-400">
        {pt ? "Consulta publicações recentes da conta oficial. A busca usa a API do X e pode consumir créditos dela."
          : "Searches recent posts from the official account. The request uses the X API and may consume its credits."}
      </p>}
      {provider === "rss" && feeds.length === 0 && <p className="mt-3 text-sm text-zinc-400">{pt ? "Cadastre uma fonte ativa com feed em Fontes." : "Register an active feed under Sources."}</p>}
    </form>
  </details>;
}
