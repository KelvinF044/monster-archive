"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { newsCopy } from "@/lib/admin/news/messages";
import { scheduleCopy } from "@/lib/admin/schedule/messages";
import { editorialCategories, FACTS_LIMIT, SUMMARY_LIMIT, type EditorialSuggestion, type GeneratedEditorialSuggestion, type SavedEditorialDraft } from "@/lib/admin/editorial/assist-model";
import type { Candidate } from "@/lib/admin/editorial/model";
import { Field, inputClass, primaryClass } from "./Controls";

const en = {
  heading: "AI draft assistance", facts: "Verified facts from the source (optional)",
  evidence: "Generation sends the candidate title, excerpt, language and any facts you add to the configured AI model.",
  generate: "Generate suggestion", regenerate: "Replace suggestion", generating: "Generating…", save: "Create draft", saving: "Creating…",
  review: "Check both versions against the original source and edit them before creating the draft.",
  eventReview: "Confirm the event date and official evidence in the event editor.",
  reused: "Reused the saved suggestion.", saved: "Draft created with the original source attached.", open: "Open in editor",
  titlePt: "Title in Portuguese", titleEn: "Title in English", summaryPt: "Summary in Portuguese", summaryEn: "Summary in English", category: "Category",
  ai_disabled: "AI assistance is disabled for this environment. You can prepare the draft manually.",
  ai_setup: "The editorial AI database migration is not available yet.",
  ai_auth: "AI Gateway authentication is unavailable.",
  ai_budget: "The shared monthly editorial AI allowance has been used.",
  ai_in_progress: "This suggestion is already being generated. Try again in a moment.",
  ai_invalid: "The model did not return a complete bilingual suggestion. Add verified facts or prepare the draft manually.",
  ai_unavailable: "The model is temporarily unavailable. You can continue editing manually.",
  ai_gateway_credits: "AI Gateway credits or the provider budget are unavailable.",
  ai_rate_limit: "The model is temporarily rate-limited. Try again later.",
  ai_verify: "AI Gateway requires account verification.",
  candidate_unavailable: "The candidate or its source changed. Refresh and check its review status.",
  candidate_duplicate: "This source URL is already linked to another item of this type.",
  unauthorized: "Sign in again to continue.",
  invalid_request: "Check the fields and try again.",
  database_error: "The editorial operation could not be completed. Refresh and try again.",
};
const pt: { [Key in keyof typeof en]: string } = {
  heading: "Rascunho assistido por IA", facts: "Fatos verificados na fonte (opcional)",
  evidence: "A geração envia o título, o trecho e o idioma do candidato, além dos fatos que você incluir, ao modelo de IA configurado.",
  generate: "Gerar sugestão", regenerate: "Substituir sugestão", generating: "Gerando…", save: "Criar rascunho", saving: "Criando…",
  review: "Confira as duas versões na fonte original e edite os textos antes de criar o rascunho.",
  eventReview: "Confirme a data e a evidência oficial no editor de eventos.",
  reused: "Sugestão salva reutilizada.", saved: "Rascunho criado com a fonte original vinculada.", open: "Abrir no editor",
  titlePt: "Título em português", titleEn: "Título em inglês", summaryPt: "Resumo em português", summaryEn: "Resumo em inglês", category: "Categoria",
  ai_disabled: "A assistência por IA está desativada neste ambiente. Você pode preparar o rascunho manualmente.",
  ai_setup: "A migração de IA editorial ainda não está disponível no banco.",
  ai_auth: "A autenticação do AI Gateway está indisponível.",
  ai_budget: "O limite mensal compartilhado de IA editorial foi atingido.",
  ai_in_progress: "Esta sugestão já está sendo gerada. Tente novamente em instantes.",
  ai_invalid: "O modelo não retornou uma sugestão bilíngue completa. Acrescente fatos verificados ou prepare o rascunho manualmente.",
  ai_unavailable: "O modelo está temporariamente indisponível. Você pode continuar a edição manualmente.",
  ai_gateway_credits: "Os créditos ou o orçamento do AI Gateway estão indisponíveis.",
  ai_rate_limit: "O modelo atingiu um limite temporário de requisições. Tente mais tarde.",
  ai_verify: "O AI Gateway exige verificação da conta.",
  candidate_unavailable: "O candidato ou a fonte foi alterado. Atualize a fila e confira o status de revisão.",
  candidate_duplicate: "A URL da fonte já está vinculada a outro item deste tipo.",
  unauthorized: "Entre novamente para continuar.",
  invalid_request: "Confira os campos e tente novamente.",
  database_error: "A operação editorial não pôde ser concluída. Atualize a fila e tente novamente.",
};

type Result = GeneratedEditorialSuggestion | { draft: SavedEditorialDraft };
type Operation = "generate" | "save";
const fields = ["title_pt", "summary_pt", "title_en", "summary_en"] as const;

export default function EditorialAssist({ candidate, disabled }: { candidate: Candidate; disabled: boolean }) {
  const { locale } = useAdminLocale();
  const c = locale === "pt-BR" ? pt : en;
  const labels = (candidate.kind === "news" ? newsCopy(locale).categories : scheduleCopy(locale).categories) as Record<string, string>;
  const linked = candidate.draft_news_id || candidate.draft_event_id;
  const [facts, setFacts] = useState("");
  const [suggestion, setSuggestion] = useState<GeneratedEditorialSuggestion | null>(null);
  const [saved, setSaved] = useState<SavedEditorialDraft | null>(null);
  const [busy, setBusy] = useState<Operation | null>(null);
  const [error, setError] = useState("");
  const running = useRef(false);
  const draftId = saved?.id || linked;

  async function assist(action: Operation, payload: Record<string, unknown>) {
    if (disabled || running.current) return;
    running.current = true;
    setBusy(action);
    setError("");
    try {
      const response = await fetch("/api/admin/editorial/assist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id: candidate.id, expectedUpdatedAt: candidate.updated_at, ...payload }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result) {
        setError(typeof result?.error === "string" ? result.error : "database_error");
        return;
      }
      const value = result as Result;
      if ("draft" in value) setSaved(value.draft);
      else setSuggestion(value);
    } catch {
      setError("database_error");
    } finally {
      running.current = false;
      setBusy(null);
    }
  }

  function change(field: keyof EditorialSuggestion, value: string) {
    setSuggestion(previous => previous ? { ...previous, suggestion: { ...previous.suggestion, [field]: value } } : previous);
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (suggestion) void assist("save", { runId: suggestion.runId, suggestion: suggestion.suggestion });
  }

  const fieldLabels = { title_pt: c.titlePt, summary_pt: c.summaryPt, title_en: c.titleEn, summary_en: c.summaryEn };
  return <details className="rounded-lg border border-purple-400/20 bg-purple-500/5 p-4" open={draftId ? true : undefined}>
    <summary className="cursor-pointer font-bold text-purple-200">{c.heading}</summary>
    {draftId ? <div className="mt-3 space-y-2 text-sm">
      {saved && !saved.existing && <p role="status" className="text-emerald-300">{c.saved}</p>}
      <Link className="font-semibold text-purple-300 hover:underline"
        href={(candidate.kind === "news" ? "/admin/news" : "/admin/schedule") + "?edit=" + encodeURIComponent(draftId)}>{c.open} →</Link>
    </div> : <div className="mt-4 space-y-4">
      <p className="text-xs leading-5 text-zinc-400">{c.evidence}</p>
      <Field label={c.facts}>
        <textarea className={inputClass} rows={2} value={facts} maxLength={FACTS_LIMIT} disabled={Boolean(busy) || disabled}
          onChange={event => setFacts(event.target.value)} />
      </Field>
      <button type="button" className={primaryClass} disabled={Boolean(busy) || disabled}
        onClick={() => void assist("generate", { facts })}>{busy === "generate" ? c.generating : suggestion ? c.regenerate : c.generate}</button>
      {error && <p role="alert" className="text-sm text-red-300">{Object.hasOwn(c, error) ? c[error as keyof typeof c] : c.database_error}</p>}
      {suggestion && <form onSubmit={create} className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-sm text-zinc-300">{c.review} {candidate.kind === "event" && c.eventReview}</p>
        {suggestion.reused && <p role="status" className="text-xs text-emerald-300">{c.reused}</p>}
        <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2" disabled={Boolean(busy) || disabled}>
          <div className="sm:col-span-2">
            <Field label={c.category}><select className={inputClass} value={suggestion.suggestion.category}
              onChange={event => change("category", event.target.value)}>
              {editorialCategories(candidate.kind).map(category => <option key={category} value={category}>{labels[category]}</option>)}
            </select></Field>
          </div>
          {(["pt", "en"] as const).map(language => <div className="min-w-0 space-y-3" key={language}>
            {fields.filter(field => field.endsWith("_" + language)).map(field => <Field key={field} label={fieldLabels[field]}>
              {field.startsWith("title")
                ? <input className={inputClass} value={suggestion.suggestion[field]} required maxLength={200} onChange={event => change(field, event.target.value)} />
                : <textarea className={inputClass} value={suggestion.suggestion[field]} required maxLength={SUMMARY_LIMIT} rows={3} onChange={event => change(field, event.target.value)} />}
            </Field>)}
          </div>)}
          <button type="submit" className={primaryClass + " justify-self-start sm:col-span-2"}>{busy === "save" ? c.saving : c.save}</button>
        </fieldset>
      </form>}
    </div>}
  </details>;
}
