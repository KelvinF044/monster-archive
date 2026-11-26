import type { CandidateKind, CandidateStatus } from "./model";

const en = {
  heading: "Editorial Center", intro: "Manage sources and review potential news and events for the archive.",
  queue: "Review queue", sources: "Sources", addSource: "New source", editSource: "Edit source", name: "Source name",
  homepage: "Homepage URL", feed: "RSS or Atom feed URL", feedHint: "Optional. Use the final public HTTPS URL of the feed.",
  active: "Active", inactive: "Inactive", type: "Source type", manual: "Manual", scan: "Scan feed",
  lastScan: "Last checked", never: "Never", save: "Save", cancel: "Cancel", edit: "Edit", open: "Open original",
  refresh: "Refresh", busy: "Working…", emptySources: "Register a source to add or discover candidates.",
  source: "Source", selectSource: "Select an active source", kind: "Content type", title: "Original title", url: "Original URL",
  excerpt: "Short excerpt (optional)", language: "Language code (optional)", sourceDate: "Source publication date (optional)",
  add: "Add candidate", addManual: "Add a candidate manually", discover: "Discover from a feed",
  term: "Keyword (optional)", termHint: "Leave blank to include all matching feed entries.",
  noFeeds: "Add an active source with a feed URL to discover candidates.",
  search: "Search titles", status: "Review status", all: "All", filter: "Filter", empty: "No candidates match these filters.",
  previous: "Previous", next: "Next", review: "Review", close: "Close", note: "Editorial note (optional)",
  candidateSaved: "Candidate added to the review queue.", sourceSaved: "Source saved.", reviewSaved: "Review saved.",
  goNews: "Open News management", goEvents: "Open Events management",
  acceptedHint: "Use the original source when preparing a draft.",
  noDate: "Date unavailable", added: "Added", duplicates: "Duplicates skipped", matches: "Matching items",
  scanFailures: "Items that could not be processed",
  x_setup: "X search requires the server-side EDITORIAL_X_BEARER_TOKEN credential.",
  x_error: "X did not return results. Check the API credential, credits and request limits.",
  publisher_error: "The selected publisher could not be read. Try again or add a candidate manually.",
  scanLimit: "Only the first 25 matching feed entries were processed. Use a more specific keyword to check others.",
  database_error: "Could not load or save editorial data. Refresh and try again.", unauthorized: "Sign in again to continue.",
  invalid_request: "Check the required fields and try again.", invalid_source: "Check the source fields and use a public HTTPS feed URL.",
  source_duplicate: "A source with this name and homepage already exists.", inactive_source: "Select an active source.",
  invalid_candidate: "Check the original URL, title and optional metadata.", candidate_duplicate: "This item is already in the queue or linked to an article or event of the same type.",
  stale: "This record changed. Refresh and open it again.",
  feed_error: "Could not read this feed. Check the direct HTTPS URL and confirm it serves valid RSS or Atom.",
  scan_partial: "The scan stopped before finishing. Saved items are in the queue. Run the scan again to retry.",
} as const;

const pt: { [K in keyof typeof en]: string } = {
  heading: "Central editorial", intro: "Gerencie fontes e revise possíveis notícias e eventos para o acervo.",
  queue: "Fila de revisão", sources: "Fontes", addSource: "Nova fonte", editSource: "Editar fonte", name: "Nome da fonte",
  homepage: "URL da página inicial", feed: "URL do feed RSS ou Atom", feedHint: "Opcional. Use a URL HTTPS pública e direta do feed.",
  active: "Ativa", inactive: "Inativa", type: "Tipo de fonte", manual: "Manual", scan: "Buscar no feed",
  lastScan: "Última busca", never: "Nunca", save: "Salvar", cancel: "Cancelar", edit: "Editar", open: "Abrir original",
  refresh: "Atualizar", busy: "Processando…", emptySources: "Cadastre uma fonte para adicionar ou descobrir candidatos.",
  source: "Fonte", selectSource: "Selecione uma fonte ativa", kind: "Tipo de conteúdo", title: "Título original", url: "URL original",
  excerpt: "Trecho curto (opcional)", language: "Código de idioma (opcional)", sourceDate: "Data de publicação na fonte (opcional)",
  add: "Adicionar candidato", addManual: "Adicionar candidato manualmente", discover: "Buscar em um feed",
  term: "Palavra-chave (opcional)", termHint: "Deixe em branco para considerar todas as entradas do feed.",
  noFeeds: "Cadastre uma fonte ativa com URL de feed para descobrir candidatos.",
  search: "Buscar títulos", status: "Status de revisão", all: "Todos", filter: "Filtrar", empty: "Nenhum candidato corresponde aos filtros.",
  previous: "Anterior", next: "Próxima", review: "Revisar", close: "Fechar", note: "Nota editorial (opcional)",
  candidateSaved: "Candidato adicionado à fila de revisão.", sourceSaved: "Fonte salva.", reviewSaved: "Revisão salva.",
  goNews: "Abrir gerenciamento de Notícias", goEvents: "Abrir gerenciamento de Eventos",
  acceptedHint: "Use a fonte original ao preparar o rascunho.",
  noDate: "Data indisponível", added: "Adicionados", duplicates: "Duplicados ignorados", matches: "Itens encontrados",
  scanFailures: "Itens que não puderam ser processados",
  x_setup: "A busca no X requer a credencial EDITORIAL_X_BEARER_TOKEN no servidor.",
  x_error: "O X não retornou resultados. Confira a credencial da API, os créditos e os limites de consulta.",
  publisher_error: "Não foi possível ler a fonte selecionada. Tente novamente ou adicione um candidato manualmente.",
  scanLimit: "A busca processou os primeiros 25 itens encontrados. Use uma palavra-chave mais específica para buscar outros.",
  database_error: "Não foi possível carregar ou salvar os dados editoriais. Atualize e tente novamente.", unauthorized: "Entre novamente para continuar.",
  invalid_request: "Confira os campos obrigatórios e tente novamente.", invalid_source: "Confira os campos da fonte e use uma URL HTTPS pública para o feed.",
  source_duplicate: "Já existe uma fonte com esse nome e página inicial.", inactive_source: "Selecione uma fonte ativa.",
  invalid_candidate: "Confira o título, a URL original e os dados opcionais.", candidate_duplicate: "Este item já está na fila ou vinculado a uma notícia ou evento do mesmo tipo.",
  stale: "O registro foi alterado. Atualize a página e abra-o novamente.",
  feed_error: "Não foi possível ler o feed. Confira se a URL HTTPS é direta e fornece RSS ou Atom válido.",
  scan_partial: "A busca parou antes de terminar. Os itens salvos estão na fila. Repita a busca para tentar novamente.",
};

export function editorialAdminCopy(locale: string) {
  const isPt = locale === "pt-BR";
  const kinds: Record<CandidateKind, string> = isPt ? { news: "Notícia", event: "Evento" } : { news: "News", event: "Event" };
  const statuses: Record<CandidateStatus, string> = isPt
    ? { pending: "Pendente", in_review: "Em revisão", accepted: "Selecionado", rejected: "Rejeitado", duplicate: "Duplicado" }
    : { pending: "Pending", in_review: "In review", accepted: "Selected", rejected: "Rejected", duplicate: "Duplicate" };
  return { text: isPt ? pt : en, kinds, statuses };
}
export type EditorialCopy = ReturnType<typeof editorialAdminCopy>;
export type EditorialError = "database_error" | "unauthorized" | "invalid_request" | "invalid_source" | "source_duplicate" | "inactive_source" | "invalid_candidate" | "candidate_duplicate" | "stale" | "feed_error" | "scan_partial" | "x_setup" | "x_error" | "publisher_error";
