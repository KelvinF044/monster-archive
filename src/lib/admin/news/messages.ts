import type { NewsCategory, NewsStatus, SourceKind } from "./model";

const en = {
  heading:"News management", intro:"Create bilingual editorial articles, attach verified sources and manage each review stage.",
  total:"Articles", create:"New article", search:"Search titles or slug", all:"All", category:"Category", status:"Status",
  searchAction:"Search", previous:"Previous", next:"Next", empty:"No articles found. Create a draft to get started.",
  loading:"Loading…", refresh:"Refresh", untitled:"Untitled draft", edit:"Open", close:"Close editor",
  draft:"New draft", details:"Article details", slug:"URL slug", slugHint:"Leave blank to generate from the title.", titlePt:"Portuguese title", titleEn:"English title",
  summaryPt:"Portuguese summary", summaryEn:"English summary", bodyPt:"Portuguese article (optional)", bodyEn:"English article (optional)",
  manualNote:"Write an original summary and link to the source. Body text is optional; use plain text.",
  era:"Era", none:"None", featured:"Feature this article", inactive:"Inactive", cover:"Cover image (optional)",
  imageUrl:"Public image URL", altPt:"Alt text — Portuguese", altEn:"Alt text — English", credit:"Image credit", imageSource:"Image source URL",
  saveDraft:"Create draft", saveChanges:"Save changes", saving:"Saving…", saved:"Saved successfully.", 
  saveFirst:"Save the draft before adding sources or related content.", locked:"This item is read-only. Return it to draft to revise content or evidence.",
  unsaved:"Save or discard your changes before continuing.", discard:"Discard changes", discardConfirm:"Discard unsaved article changes?",
  confirmAction:"Confirm action", cancel:"Cancel", publishedWorkflow:"Article published successfully.", approvedWorkflow:"Article approved. Ready to publish.", archivedWorkflow:"Article archived.",
  review:"Editorial workflow", ready:"Ready for approval", notReady:"Before approval, complete both languages and add at least one attributed source.",
  reviewStep:"Submit for review", approve:"Approve", reject:"Reject", publish:"Publish", archive:"Archive", returnDraft:"Return to draft",
  publishConfirm:"Publish this approved article in the testing environment? The public feed will be connected in a later step.",
  archiveConfirm:"Archive this article? It will no longer be publicly visible.", returnConfirm:"Return to draft? Published content will be removed from the public state until reviewed again.",
  rejectConfirm:"Reject this article?", approveConfirm:"Confirm that you have reviewed the titles, summaries and sources in both languages.",
  sources:"Sources and attribution", sourcesHelp:"Add a source from the shared registry. No external content is fetched automatically.",
  chooseSource:"Choose a source", sourceUrl:"Original article URL", addSource:"Attach source", remove:"Remove", noSources:"No sources attached.",
  registerSource:"Register a source", sourceName:"Source name", homepage:"Source homepage URL", sourceKind:"Source type", register:"Register and select",
  duplicateSource:"This link is already attached to another article. Attach it only if it is relevant to a different verified story.",
  sharedConfirm:"Attach the same source URL to this article as well?", members:"Related members", videos:"Related Watch videos",
  videosHelp:"Search the existing archive and attach relevant videos. Draft videos remain private.", videoSearch:"Search video title", noVideos:"No linked videos.",
  noVideoResults:"No matching videos.", add:"Add", select:"Select", sourceInactive:"This source is inactive.", readOnly:"Read-only",
  updated:"Updated", publishedAt:"Published", approvedAt:"Approved", noDate:"—", sourceRegistered:"Source registered. Attach its original article URL below.",
  generalError:"Could not complete the operation. Please refresh and try again.",
  invalid_request:"Check the required fields, URL format and input length.",
  invalid_slug:"This slug is already used. Choose a different one.",
  duplicate_link:"This source or relationship already exists.",
  source_shared:"The canonical source URL is attached to another article.",
  stale:"The record changed since you opened it. Refresh before updating.",
  unauthorized:"Administrator session expired. Sign in again.",
  not_found:"The requested record no longer exists.",
  locked_error:"Return the article to draft before editing it.",
  review_failed:"The transition was not allowed. Check the bilingual content and attributed sources.",
  invalid_relation:"The selected record is missing or inactive.",
  database_error:"The database operation did not complete. Confirm the editorial migration and try again.",
  unavailable:"Unable to load the news workspace. Confirm that the Phase 2.3.1 migration was applied.",
  articleSaved:"Article saved.", sourceAttached:"Source attached.", relationSaved:"Relationship updated.", workflowSaved:"Editorial status updated.",
} as const;
type Copy = {[K in keyof typeof en]: string};
const pt: Copy = {
  heading:"Gerenciamento de notícias", intro:"Crie notícias bilíngues, vincule fontes verificadas e gerencie cada etapa da revisão.",
  total:"Notícias", create:"Nova notícia", search:"Pesquisar títulos ou slug", all:"Todos", category:"Categoria", status:"Status",
  searchAction:"Pesquisar", previous:"Anterior", next:"Próxima", empty:"Nenhuma notícia encontrada. Crie um rascunho para começar.",
  loading:"Carregando…", refresh:"Atualizar", untitled:"Rascunho sem título", edit:"Abrir", close:"Fechar editor",
  draft:"Novo rascunho", details:"Detalhes da notícia", slug:"Slug da URL", slugHint:"Deixe em branco para gerar a partir do título.", titlePt:"Título em português", titleEn:"Título em inglês",
  summaryPt:"Resumo em português", summaryEn:"Resumo em inglês", bodyPt:"Artigo em português (opcional)", bodyEn:"Artigo em inglês (opcional)",
  manualNote:"Escreva um resumo próprio e vincule a fonte. O texto completo é opcional; use texto simples.",
  era:"Era", none:"Nenhuma", featured:"Destacar esta notícia", inactive:"Inativa", cover:"Imagem de capa (opcional)",
  imageUrl:"URL pública da imagem", altPt:"Texto alternativo — Português", altEn:"Texto alternativo — Inglês", credit:"Crédito da imagem", imageSource:"URL da fonte da imagem",
  saveDraft:"Criar rascunho", saveChanges:"Salvar alterações", saving:"Salvando…", saved:"Salvo com sucesso.",
  saveFirst:"Salve o rascunho antes de adicionar fontes ou conteúdos relacionados.", locked:"Este item está bloqueado para edição. Volte ao rascunho para revisar o conteúdo ou as fontes.",
  unsaved:"Salve ou descarte suas alterações antes de continuar.", discard:"Descartar alterações", discardConfirm:"Descartar alterações não salvas da notícia?",
  confirmAction:"Confirmar ação", cancel:"Cancelar", publishedWorkflow:"Notícia publicada com sucesso.", approvedWorkflow:"Notícia aprovada. Pronta para publicar.", archivedWorkflow:"Notícia arquivada.",
  review:"Fluxo editorial", ready:"Pronto para aprovação", notReady:"Antes de aprovar, complete os dois idiomas e adicione pelo menos uma fonte.",
  reviewStep:"Enviar para revisão", approve:"Aprovar", reject:"Rejeitar", publish:"Publicar", archive:"Arquivar", returnDraft:"Voltar ao rascunho",
  publishConfirm:"Publicar esta notícia aprovada na homologação? A página pública será conectada em uma etapa posterior.",
  archiveConfirm:"Arquivar esta notícia? Ela deixará de ser publicamente visível.", returnConfirm:"Voltar ao rascunho? Conteúdos publicados sairão do estado público até nova revisão.",
  rejectConfirm:"Rejeitar esta notícia?", approveConfirm:"Confirme que revisou os títulos, resumos e fontes nos dois idiomas.",
  sources:"Fontes e atribuição", sourcesHelp:"Vincule uma fonte do cadastro compartilhado. Nenhum conteúdo externo será coletado automaticamente.",
  chooseSource:"Escolha uma fonte", sourceUrl:"URL original da notícia", addSource:"Vincular fonte", remove:"Remover", noSources:"Nenhuma fonte vinculada.",
  registerSource:"Cadastrar uma fonte", sourceName:"Nome da fonte", homepage:"URL da página inicial da fonte", sourceKind:"Tipo de fonte", register:"Cadastrar e selecionar",
  duplicateSource:"Este link já está vinculado a outra notícia. Vincule-o somente se for relevante para outro acontecimento verificado.",
  sharedConfirm:"Vincular a mesma URL de fonte a esta notícia também?", members:"Integrantes relacionadas", videos:"Vídeos relacionados da Watch",
  videosHelp:"Pesquise o acervo existente e vincule vídeos relevantes. Vídeos em rascunho permanecem privados.", videoSearch:"Pesquisar título do vídeo", noVideos:"Nenhum vídeo vinculado.",
  noVideoResults:"Nenhum vídeo encontrado.", add:"Adicionar", select:"Selecionar", sourceInactive:"Esta fonte está inativa.", readOnly:"Somente leitura",
  updated:"Atualizado", publishedAt:"Publicado", approvedAt:"Aprovado", noDate:"—", sourceRegistered:"Fonte cadastrada. Vincule sua URL original abaixo.",
  generalError:"Não foi possível concluir a operação. Atualize e tente novamente.",
  invalid_request:"Confira os campos obrigatórios, o formato das URLs e o tamanho dos textos.",
  invalid_slug:"Este slug já está em uso. Escolha outro.",
  duplicate_link:"Esta fonte ou relação já existe.",
  source_shared:"A URL canônica já está vinculada a outra notícia.",
  stale:"O registro foi alterado desde que você o abriu. Atualize antes de editar.",
  unauthorized:"A sessão administrativa expirou. Entre novamente.",
  not_found:"O registro solicitado não existe mais.",
  locked_error:"Volte ao rascunho antes de editar a notícia.",
  review_failed:"A mudança de status não foi permitida. Confira o conteúdo bilíngue e as fontes.",
  invalid_relation:"O registro selecionado não existe ou está inativo.",
  database_error:"A operação no banco não foi concluída. Confira a migração editorial e tente novamente.",
  unavailable:"Não foi possível carregar as notícias. Confirme a aplicação da migração da Fase 2.3.1.",
  articleSaved:"Notícia salva.", sourceAttached:"Fonte vinculada.", relationSaved:"Relacionamento atualizado.", workflowSaved:"Status editorial atualizado.",
};
const statusEn: Record<NewsStatus,string> = {draft:"Draft",in_review:"In review",approved:"Approved",rejected:"Rejected",published:"Published",archived:"Archived"};
const statusPt: Record<NewsStatus,string> = {draft:"Rascunho",in_review:"Em revisão",approved:"Aprovado",rejected:"Rejeitado",published:"Publicado",archived:"Arquivado"};
const catEn: Record<NewsCategory,string> = {official_announcements:"Official Announcements", music_releases:"Music & Releases",tours_concerts:"Tours & Concerts",interviews:"Interviews",awards:"Awards",media_appearances:"Media & Appearances",achievements:"Achievements"};
const catPt: Record<NewsCategory,string> = {official_announcements:"Comunicados oficiais",music_releases:"Música e lançamentos",tours_concerts:"Shows e turnês",interviews:"Entrevistas",awards:"Premiações",media_appearances:"Mídia e aparições",achievements:"Conquistas"};
const sourceEn: Record<SourceKind,string> = {official_group:"Official group/agency",official_organizer:"Official organizer",official_broadcaster:"Official broadcaster",trusted_press:"Trusted press",manual:"Manual source"};
const sourcePt: Record<SourceKind,string> = {official_group:"Grupo/agência oficial",official_organizer:"Organizador oficial",official_broadcaster:"Emissora oficial",trusted_press:"Portal confiável",manual:"Fonte manual"};
export function newsCopy(locale: string) {
  const isPt = locale === "pt-BR";
  return {text:isPt?pt:en, statuses:isPt?statusPt:statusEn, categories:isPt?catPt:catEn, sources:isPt?sourcePt:sourceEn};
}
export type NewsCopy = ReturnType<typeof newsCopy>;
export function newsError(copy: NewsCopy, key: string) {
  return Object.hasOwn(copy.text,key) ? copy.text[key as keyof Copy] : copy.text.generalError;
}
