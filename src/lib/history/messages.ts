import type { Locale } from "@/lib/i18n/config";

const en = {
  history: "Watch history",
  shared: "Recently watched",
  empty: "Your watch history is empty. Play a video in Watch to get started.",
  active: "History recording is on.",
  paused: "History recording is paused.",
  pause: "Pause history",
  resume: "Resume recording",
  clear: "Clear history",
  clearConfirm: "Clear your entire watch history?",
  cancel: "Cancel",
  remove: "Remove from history",
  continueAt: "Continue at",
  completed: "Watched",
  loadError: "Couldn’t load your watch history. Try again.",
  updateError: "Couldn’t update your watch history. Try again.",
  privacyHint: "Favorites and watch history are shared only while your profile is public.",
};

const pt: typeof en = {
  history: "Histórico",
  shared: "Assistidos recentemente",
  empty: "Seu histórico está vazio. Reproduza um vídeo no Watch para começar.",
  active: "O registro do histórico está ativado.",
  paused: "O registro do histórico está pausado.",
  pause: "Pausar histórico",
  resume: "Retomar registro",
  clear: "Limpar histórico",
  clearConfirm: "Limpar todo o seu histórico de vídeos?",
  cancel: "Cancelar",
  remove: "Remover do histórico",
  continueAt: "Continuar em",
  completed: "Assistido",
  loadError: "Não foi possível carregar seu histórico. Tente novamente.",
  updateError: "Não foi possível atualizar seu histórico. Tente novamente.",
  privacyHint: "Os favoritos e o histórico só são compartilhados enquanto seu perfil está público.",
};

export function historyMessages(locale: Locale) {
  return locale === "pt-BR" ? pt : en;
}
