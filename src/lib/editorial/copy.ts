import type { Locale } from "../i18n/config";

const labels = {
  en: {
    news: "News", schedule: "Events", newsIntro: "Follow BABYMONSTER announcements, releases and memorable moments.", scheduleIntro: "Explore BABYMONSTER’s official activities and upcoming schedule.",
    featured: "Featured story", latest: "Latest news", search: "Search", searchPlaceholder: "Search titles or summaries", category: "Category", era: "Era", member: "Member", status: "Event status", all: "All", apply: "Apply filters", reset: "Clear filters", previous: "Previous", next: "Next", results: "results",
    emptyNews: "No published news found.", emptyEvents: "No published events found.", emptyHint: "Try changing your filters or check back for updates.", unavailable: "This section is temporarily unavailable. Please try again later.", read: "Read article", details: "Event details", upcoming: "Upcoming", calendar: "Calendar", history: "History", calendarNote: "Calendar dates follow the original event location. Times also appear in your local time zone.", calendarLimit: "Only the first 200 matching events are displayed. Narrow your filters to see more.",
    originalTime: "Event local time", yourTime: "Your local time", allDay: "All day", timeTba: "Time to be announced", dateTba: "Date to be announced", venue: "Location", officialLink: "Official event information", source: "Sources", imageCredit: "Image credit", imageSource: "Image source", relatedMembers: "Related members", relatedVideos: "Related Watch videos", back: "Back to", published: "Published", eventCount: "events", more: "more", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  },
  "pt-BR": {
    news: "Notícias", schedule: "Eventos", newsIntro: "Acompanhe comunicados, lançamentos e momentos marcantes do BABYMONSTER.", scheduleIntro: "Explore as atividades oficiais e a agenda do BABYMONSTER.",
    featured: "Notícia em destaque", latest: "Últimas notícias", search: "Buscar", searchPlaceholder: "Buscar títulos ou resumos", category: "Categoria", era: "Era", member: "Integrante", status: "Situação do evento", all: "Todas", apply: "Filtrar", reset: "Limpar filtros", previous: "Anterior", next: "Próxima", results: "resultados",
    emptyNews: "Nenhuma notícia publicada encontrada.", emptyEvents: "Nenhum evento publicado encontrado.", emptyHint: "Altere os filtros ou volte mais tarde para novidades.", unavailable: "Esta seção está temporariamente indisponível. Tente novamente mais tarde.", read: "Ler notícia", details: "Detalhes do evento", upcoming: "Próximos", calendar: "Calendário", history: "Histórico", calendarNote: "O calendário mantém as datas locais dos eventos. Os horários também aparecem no seu fuso.", calendarLimit: "Apenas os primeiros 200 eventos correspondentes são exibidos. Refine os filtros para ver mais.",
    originalTime: "Horário local do evento", yourTime: "Seu horário local", allDay: "Dia inteiro", timeTba: "Horário a confirmar", dateTba: "Data a confirmar", venue: "Local", officialLink: "Informações oficiais do evento", source: "Fontes", imageCredit: "Crédito da imagem", imageSource: "Fonte da imagem", relatedMembers: "Integrantes relacionados", relatedVideos: "Vídeos relacionados no Watch", back: "Voltar para", published: "Publicado em", eventCount: "eventos", more: "mais", days: ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],
  },
};
export const editorialCopy = (locale: Locale) => labels[locale];
const categories: Record<string, [string,string]> = {
  official_announcements:["Official announcements","Comunicados oficiais"], music_releases:["Music releases","Lançamentos musicais"],
  tours_concerts:["Tours & concerts","Turnês e shows"], interviews:["Interviews","Entrevistas"], awards:["Awards","Premiações"],
  media_appearances:["Media appearances","Participações na mídia"], achievements:["Achievements","Conquistas"],
  release:["Release","Lançamento"], concert:["Concert","Show"], festival:["Festival","Festival"], music_show:["Music show","Programa musical"],
  interview:["Interview","Entrevista"], broadcast:["Broadcast","Transmissão"], promotion:["Promotion","Promoção"], other:["Other","Outros"],
  confirmed:["Confirmed","Confirmado"], postponed:["Postponed","Adiado"], rescheduled:["Rescheduled","Reagendado"], cancelled:["Cancelled","Cancelado"], completed:["Completed","Concluído"],
};
export function label(value: string, locale: Locale) { return categories[value]?.[locale === "pt-BR" ? 1 : 0] ?? value; }
