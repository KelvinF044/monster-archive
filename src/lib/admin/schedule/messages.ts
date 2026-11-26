import { newsCopy } from "../news/messages";
import type { EventCategory, EventStatus, TimeKind } from "./model";
const en = {
  heading:"Events management",intro:"Manage the official calendar, local dates and times, sources and each editorial review stage.",
  findEvents:"Find new events",eventDiscoverySource:"Official source",openEventSource:"Open source",
  noUpcomingDiscoveries:"This source lists no upcoming events.",reviewFoundEvent:"Review and edit",openSavedEvent:"Open saved event",
  discovery_unavailable:"Unable to read this official schedule. Check the source or try again later.",
  total:"Events",create:"New event",empty:"No events found. Create a draft to get started.",untitled:"Untitled event draft",draft:"New event draft",details:"Event details",
  discardConfirm:"Discard unsaved event changes?", featured:"Feature this event", manualNote:"Use the official announced information and your own bilingual summary.",
  sourceUrl:"Official announcement or source URL", sourcesHelp:"Attach evidence from the shared source registry. Publication requires an official source that confirms the event.",
  publishConfirm:"Publish this approved event on the public calendar of this environment?",
  approveConfirm:"Confirm that you have reviewed both languages, the local date and time, the time zone and the official evidence.",
  archiveConfirm:"Archive this event? It will no longer be publicly visible.",returnConfirm:"Return to draft? The event will leave the public state until reviewed again.",rejectConfirm:"Reject this event?",
  locked:"This event is read-only. Return it to draft to revise its details or evidence.",locked_error:"Return the event to draft before editing it.",
  saveFirst:"Save the draft before adding sources or related content.",notReady:"Before approval, fill both titles and summaries, add a confirmed date and attach at least one official source that confirms the event.",
  sourceRegistered:"Source registered. Attach the announcement URL below.", rejectedWorkflow:"Event rejected. Return it to draft to revise.",
  publishedWorkflow:"Event published successfully.",approvedWorkflow:"Event approved. Ready to publish.",archivedWorkflow:"Event archived.",
  review_failed:"The transition was not allowed. Check the bilingual content, confirmed date and official evidence.",
  invalid_slug:"This slug is already used. Choose a different one.",articleSaved:"Event saved.",unavailable:"Unable to load the events workspace. Confirm that the Phase 2.3.1 migration was applied.",
  activityStatus:"Event status",month:"Calendar month",date:"Event date",noDateConfirmed:"Date not announced",schedule:"Date and time",startDate:"Start date (local)",endDate:"End date (optional, local)",
  timeKind:"Time precision",zone:"Original time zone (IANA)",zoneHint:"For example, Asia/Seoul or America/Sao_Paulo. Required for a timed event.",
  startTime:"Start time (local)",endTime:"End time (optional, local)",endHint:"If an end time is known, enter its local end date as well.",
  timeHint:"All-day and time-to-be-announced events keep the local date without storing an invented clock time.",
  dateHint:"A draft may have no date; approval requires a confirmed local calendar date. If postponed without a replacement date, retain the original date.",
  location:"City / location (optional)", venue:"Venue (optional)",eventUrl:"Official event URL (optional)",locationDetails:"Location and official link",
  officialEvidence:"This source officially confirms the event",officialBadge:"Official confirmation",referenceBadge:"Reference",officialSourceHint:"Only official group, organizer or broadcaster sources may be marked as official evidence.",
  invalid_date:"Enter a valid local calendar date.",invalid_timezone:"Enter a valid IANA time zone for the event.",invalid_time:"Enter a valid local time, or choose All day / Time TBA.",
  nonexistent_time:"This local time does not exist in the selected time zone. Check daylight-saving changes.",
  ambiguous_time:"This local time occurs twice. Select the first or second occurrence.",invalid_end:"The end must not precede the start; enter an end date if an end time is provided.",
  official_source_required:"Select an official source before marking official evidence.",utc:"Stored UTC time",occurrence:"Repeated local time",chooseOccurrence:"Choose an occurrence",earlier:"First occurrence",later:"Second occurrence",
  history:"Recent event history",historyHint:"Date, time and status changes are retained in the editorial audit log.",noHistory:"No recent changes.",statusChanged:"Status changed",dateChanged:"Date changed",recordUpdated:"Updated",recordCreated:"Created",originalDate:"Original date",newDate:"New date",
};
type ExtraCopy={ [K in keyof typeof en]: string };
const pt:ExtraCopy={
  heading:"Gerenciamento de eventos",intro:"Gerencie a agenda oficial, datas e horários locais, fontes e cada etapa da revisão editorial.",
  findEvents:"Buscar novos eventos",eventDiscoverySource:"Fonte oficial",openEventSource:"Abrir fonte",
  noUpcomingDiscoveries:"Esta fonte não lista próximos eventos.",reviewFoundEvent:"Revisar e editar",openSavedEvent:"Abrir evento cadastrado",
  discovery_unavailable:"Não foi possível consultar esta agenda oficial. Confira a fonte ou tente novamente mais tarde.",
  total:"Eventos",create:"Novo evento",empty:"Nenhum evento encontrado. Crie um rascunho para começar.",untitled:"Rascunho de evento sem título",draft:"Novo rascunho de evento",details:"Detalhes do evento",
  discardConfirm:"Descartar alterações não salvas do evento?",featured:"Destacar este evento",manualNote:"Utilize as informações anunciadas oficialmente e escreva seu próprio resumo bilíngue.",
  sourceUrl:"URL do anúncio oficial ou fonte",sourcesHelp:"Vincule uma evidência do cadastro compartilhado. A publicação exige uma fonte oficial que confirme o evento.",
  publishConfirm:"Publicar este evento aprovado na agenda pública deste ambiente?",
  approveConfirm:"Confirme que revisou os dois idiomas, a data e o horário locais, o fuso e a evidência oficial.",
  archiveConfirm:"Arquivar este evento? Ele deixará de ser publicamente visível.",returnConfirm:"Voltar ao rascunho? O evento sairá do estado público até nova revisão.",rejectConfirm:"Rejeitar este evento?",
  locked:"Este evento está bloqueado para edição. Volte ao rascunho para revisar os detalhes ou as fontes.",locked_error:"Volte ao rascunho antes de editar o evento.",
  saveFirst:"Salve o rascunho antes de adicionar fontes ou conteúdos relacionados.",notReady:"Antes de aprovar, complete os títulos e resumos nos dois idiomas, informe a data confirmada e vincule uma fonte oficial que confirme o evento.",
  sourceRegistered:"Fonte cadastrada. Vincule a URL do anúncio abaixo.", rejectedWorkflow:"Evento rejeitado. Volte ao rascunho para revisar.",
  publishedWorkflow:"Evento publicado com sucesso.",approvedWorkflow:"Evento aprovado. Pronto para publicar.",archivedWorkflow:"Evento arquivado.",
  review_failed:"A mudança de status não foi permitida. Confira o conteúdo bilíngue, a data confirmada e a evidência oficial.",
  invalid_slug:"Este slug já está em uso. Escolha outro.",articleSaved:"Evento salvo.",unavailable:"Não foi possível carregar os eventos. Confirme a aplicação da migração da Fase 2.3.1.",
  activityStatus:"Status do evento",month:"Mês da agenda",date:"Data do evento",noDateConfirmed:"Data não anunciada",schedule:"Data e horário",startDate:"Data inicial (local)",endDate:"Data final (opcional, local)",
  timeKind:"Precisão do horário",zone:"Fuso horário original (IANA)",zoneHint:"Ex.: Asia/Seoul ou America/Sao_Paulo. Obrigatório quando houver horário.",
  startTime:"Horário inicial (local)",endTime:"Horário final (opcional, local)",endHint:"Se houver horário final, informe também a data final local.",
  timeHint:"Eventos de dia inteiro ou com horário a anunciar preservam a data local, sem inventar um horário.",
  dateHint:"Um rascunho pode ficar sem data; a aprovação exige data local confirmada. Em caso de adiamento sem nova data, preserve a data original.",
  location:"Cidade / localização (opcional)",venue:"Local do evento (opcional)",eventUrl:"URL oficial do evento (opcional)",locationDetails:"Localização e link oficial",
  officialEvidence:"Esta fonte confirma oficialmente o evento",officialBadge:"Confirmação oficial",referenceBadge:"Referência",officialSourceHint:"Somente fontes oficiais do grupo, organizador ou emissora podem ser marcadas como evidência oficial.",
  invalid_date:"Informe uma data local válida.",invalid_timezone:"Informe um fuso horário IANA válido para o evento.",invalid_time:"Informe um horário local válido ou escolha Dia inteiro / Horário a anunciar.",
  nonexistent_time:"Este horário local não existe no fuso selecionado. Confira a mudança de horário de verão.",
  ambiguous_time:"Este horário local ocorre duas vezes. Selecione a primeira ou segunda ocorrência.",invalid_end:"O término não pode anteceder o início. Informe a data final se houver horário final.",
  official_source_required:"Selecione uma fonte oficial antes de marcar evidência oficial.",utc:"Horário UTC armazenado",occurrence:"Horário local repetido",chooseOccurrence:"Escolha uma ocorrência",earlier:"Primeira ocorrência",later:"Segunda ocorrência",
  history:"Histórico recente do evento",historyHint:"As mudanças de data, horário e status são preservadas no registro editorial.",noHistory:"Nenhuma mudança recente.",statusChanged:"Status alterado",dateChanged:"Data alterada",recordUpdated:"Atualizado",recordCreated:"Criado",originalDate:"Data original",newDate:"Nova data",
};
const catEn:Record<EventCategory,string>={release:"Music release",concert:"Concert",festival:"Festival",music_show:"Music show",interview:"Interview",broadcast:"Broadcast / stream",awards:"Awards",promotion:"Promotion",other:"Other"};
const catPt:Record<EventCategory,string>={release:"Lançamento musical",concert:"Show",festival:"Festival",music_show:"Programa musical",interview:"Entrevista",broadcast:"Transmissão",awards:"Premiação",promotion:"Promoção",other:"Outro"};
const statusEn:Record<EventStatus,string>={confirmed:"Confirmed",postponed:"Postponed",rescheduled:"Rescheduled",cancelled:"Cancelled",completed:"Completed"};
const statusPt:Record<EventStatus,string>={confirmed:"Confirmado",postponed:"Adiado",rescheduled:"Remarcado",cancelled:"Cancelado",completed:"Concluído"};
const timeEn:Record<TimeKind,string>={timed:"Exact time",all_day:"All day",time_tba:"Time TBA"};
const timePt:Record<TimeKind,string>={timed:"Horário confirmado",all_day:"Dia inteiro",time_tba:"Horário a anunciar"};
export function scheduleCopy(locale:string){
  const n=newsCopy(locale),isPt=locale==="pt-BR";
  return {...n,text:{...n.text,...(isPt?pt:en)},categories:isPt?catPt:catEn,eventStatuses:isPt?statusPt:statusEn,timeKinds:isPt?timePt:timeEn};
}
export type ScheduleCopy=ReturnType<typeof scheduleCopy>;
export function scheduleError(copy:ScheduleCopy,key:string){return Object.hasOwn(copy.text,key)?String(copy.text[key as keyof typeof copy.text]):copy.text.generalError;}
