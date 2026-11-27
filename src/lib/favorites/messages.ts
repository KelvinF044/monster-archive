import type { Locale } from "@/lib/i18n/config";

const en = {
  library: "My library",
  favorites: "Favorites",
  shared: "Favorite videos",
  save: "Add to favorites",
  remove: "Remove from favorites",
  saved: "Favorited",
  login: "Log in to favorite",
  empty: "You haven’t added any videos to your favorites yet.",
  browse: "Explore Watch",
  error: "Couldn’t update your favorites. Try again.",
  loadError: "Couldn’t load your favorites. Try again.",
  previous: "Previous",
  next: "Next",
};

const pt: typeof en = {
  library: "Minha Biblioteca",
  favorites: "Favoritos",
  shared: "Vídeos favoritos",
  save: "Adicionar aos favoritos",
  remove: "Remover dos favoritos",
  saved: "Favoritado",
  login: "Entre para favoritar",
  empty: "Você ainda não adicionou vídeos aos favoritos.",
  browse: "Explorar Vídeos",
  error: "Não foi possível atualizar seus favoritos. Tente novamente.",
  loadError: "Não foi possível carregar seus favoritos. Tente novamente.",
  previous: "Anterior",
  next: "Próxima",
};

export function favoritesMessages(locale: Locale) {
  return locale === "pt-BR" ? pt : en;
}
