
import type { Locale } from "./config";

type CollectionTranslation = {
  title: string;
  label: string;
  description: string;
};

export type Dictionary = {
  navigation: {
    home: string;
    members: string;
    watch: string;
    about: string;
    globalArchive: string;
    selectLanguage: string;
  };

  home: {
    heroEyebrow: string;
    heroLine1: string;
    heroLine2: string;
    heroLine3: string;
    heroDescription: string;
    heroImageAlt: string;
    exploreArchive: string;
    aboutProject: string;

    membersStat: string;
    memoriesStat: string;
    communityValue: string;
    communityStat: string;

    discoverEyebrow: string;
    catalogTitle: string;
    catalogDescription: string;
    searchPlaceholder: string;

    filters: {
      all: string;
      preDebut: string;
      stages: string;
      variety: string;
      behind: string;
      events: string;
      awards: string;
    };

    collectionSingular: string;
    collectionPlural: string;
    explore: string;

    noContentTitle: string;
    noContentDescription: string;
    clearFilters: string;

    errorTitle: string;
    errorDescription: string;

    aboutEyebrow: string;
    aboutTitle: string;
    aboutSubtitle: string;
    aboutDescription: string;

    footerDisclaimer: string;

    collectionContent: Record<string, CollectionTranslation>;
  };

  members: {
    eyebrow: string;
    title: string;
    description: string;
    allMembers: string;
    memberCount: string;
    profileLink: string;
    footerDisclaimer: string;
  };

  memberProfile: {
    archiveLabel: string;
    exploreProfile: string;
    allMembers: string;
    profileDescription: string;

    informationEyebrow: string;
    aboutTitle: string;
    aboutDescription: string;

    performancesTitle: string;
    performancesDescription: string;

    varietyTitle: string;
    varietyDescription: string;

    behindTitle: string;
    behindDescription: string;

    comingSoon: string;
    footerDisclaimer: string;
  };

  watch: {
    heroEyebrow: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroDescription: string;
    exploreCatalogue: string;

    discoverEyebrow: string;
    catalogTitle: string;
    catalogDescription: string;
    searchPlaceholder: string;

    filters: {
      all: string;
      preDebut: string;
      stages: string;
      variety: string;
      behind: string;
      events: string;
      awards: string;
      musicVideos: string;
    };

    categoryNames: Record<string, string>;
    collectionHeaders: Record<string, string>;

    collectionSingular: string;
    collectionPlural: string;
    explore: string;

    noCollectionsTitle: string;
    noCollectionsDescription: string;
    clearFilters: string;

    errorTitle: string;
    errorDescription: string;
    collectionErrorTitle: string;
    collectionVideosErrorTitle: string;
    videosErrorTitle: string;

    cataloguedVideos: string;
    independentArchive: string;
    videoDetails: string;
    sortLabel: string;
    newestFirst: string;
    oldestFirst: string;

    archiveGrowingTitle: string;
    noPublishedVideos: string;
    newEntriesSoon: string;
    backToWatch: string;

    informationEyebrow: string;
    informationTitle: string;
    informationDescription: string;

    footerDisclaimer: string;
  };

  videoPage: {
    collectionErrorTitle: string;
    videoErrorTitle: string;
    relationshipErrorTitle: string;

    archiveLabel: string;
    aboutVideo: string;
    noDescription: string;

    videoInformation: string;
    publicationDate: string;
    originalSource: string;
    archiveStatus: string;
    published: string;

    watchOriginal: string;
    backToCollection: string;
    footerDisclaimer: string;
  };
};

export const messages: Record<Locale, Dictionary> = {
  en: {
    navigation: {
      home: "Home",
      members: "Members",
      watch: "Watch",
      about: "About",
      globalArchive: "GLOBAL FAN ARCHIVE",
      selectLanguage: "Select language",
    },

    home: {
      heroEyebrow: "THE ULTIMATE BABYMONSTER ARCHIVE",
      heroLine1: "EVERY ERA.",
      heroLine2: "EVERY STAGE.",
      heroLine3: "EVERY MEMORY.",
      heroDescription:
        "Discover the history, performances, music and unforgettable moments of BABYMONSTER. All in one place, made by fans, for fans.",
      heroImageAlt: "BABYMONSTER seven members — DRIP Era",
      exploreArchive: "EXPLORE THE ARCHIVE →",
      aboutProject: "ABOUT THE PROJECT",

      membersStat: "MEMBERS",
      memoriesStat: "MEMORIES",
      communityValue: "GLOBAL",
      communityStat: "COMMUNITY",

      discoverEyebrow: "DISCOVER SOMETHING NEW",
      catalogTitle: "Explore the archive",
      catalogDescription: "Every moment has a story.",
      searchPlaceholder: "Search the archive...",

      filters: {
        all: "All",
        preDebut: "Pre-debut",
        stages: "Stages",
        variety: "Variety",
        behind: "Behind",
        events: "Events",
        awards: "Awards",
      },

      collectionSingular: "COLLECTION",
      collectionPlural: "COLLECTIONS",
      explore: "EXPLORE ↗",

      noContentTitle: "No content found.",
      noContentDescription:
        "Try another search or category.",
      clearFilters: "CLEAR FILTERS",

      errorTitle: "Unable to load the archive.",
      errorDescription:
        "We could not retrieve the collections. Please refresh the page and try again.",

      aboutEyebrow: "MADE BY FANS. FOR FANS.",
      aboutTitle: "One group. One archive.",
      aboutSubtitle: "A world of memories.",
      aboutDescription:
        "An independent fan project dedicated to preserving and organizing information about BABYMONSTER for fans around the world.",

      footerDisclaimer:
        "Independent fan-made project. Not affiliated with YG Entertainment.",

      collectionContent: {
        "music-videos": {
          title: "Official Music Videos",
          label: "OFFICIAL M/V",
          description:
            "Official BABYMONSTER music videos and official music video versions.",
        },
        "pre-debut": {
          title: "Before the Debut",
          label: "THE BEGINNING",
          description:
            "Discover the journey, evaluations and moments before the official debut.",
        },
        "music-show-stages": {
          title: "Stages & Performance Videos",
          label: "LIVE PERFORMANCES",
          description:
            "Music shows, official performance videos and special stages.",
        },
        "variety-interviews": {
          title: "Variety & Interviews",
          label: "OFF STAGE",
          description:
            "Explore variety programs, interviews, games and television appearances.",
        },
        "behind-the-scenes": {
          title: "Behind the Scenes",
          label: "BEHIND THE CAMERAS",
          description:
            "A collection dedicated to backstage moments and special documentaries.",
        },
        "live-events": {
          title: "Live & Festival Events",
          label: "ON THE STAGE",
          description:
            "Concerts, festivals, special appearances and live event performances.",
        },
        awards: {
          title: "Awards & Special Stages",
          label: "SPECIAL MOMENTS",
          description:
            "Award ceremonies, nominations, wins and special performances.",
        },
      },
    },

    members: {
      eyebrow: "GET TO KNOW THEM",
      title: "THE MEMBERS",
      description:
        "Discover the seven members of BABYMONSTER. Explore their stories, performances, activities and unforgettable moments.",
      allMembers: "ALL MEMBERS",
      memberCount: "MEMBERS",
      profileLink: "MEMBER PROFILE",
      footerDisclaimer:
        "Independent fan-made project. Not affiliated with YG Entertainment.",
    },

    memberProfile: {
      archiveLabel: "MEMBER ARCHIVE",
      exploreProfile: "EXPLORE PROFILE",
      allMembers: "ALL MEMBERS",
      profileDescription:
        "Explore the archive dedicated to {name}. Discover performances, interviews, activities and memorable moments throughout the BABYMONSTER journey.",

      informationEyebrow: "MEMBER INFORMATION",
      aboutTitle: "ABOUT {name}",
      aboutDescription:
        "This profile is dedicated to organizing verified information, official content and archive entries related to {name}. More information will be added as the archive develops.",

      performancesTitle: "PERFORMANCES",
      performancesDescription: "Stages and live appearances",

      varietyTitle: "VARIETY",
      varietyDescription: "Shows and interviews",

      behindTitle: "BEHIND",
      behindDescription:
        "Behind the scenes and special content",

      comingSoon: "ARCHIVE COMING SOON",
      footerDisclaimer: "Independent fan-made project.",
    },

    watch: {
      heroEyebrow: "THE BABYMONSTER VIDEO ARCHIVE",
      heroTitleLine1: "WATCH",
      heroTitleLine2: "EVERY MOMENT.",
      heroDescription:
        "Explore performances, music shows, variety programs, interviews and unforgettable moments from the BABYMONSTER journey.",
      exploreCatalogue: "EXPLORE CATALOGUE →",

      discoverEyebrow: "DISCOVER THE ARCHIVE",
      catalogTitle: "Explore collections",
      catalogDescription:
        "Find your favorite BABYMONSTER moments.",
      searchPlaceholder: "Search the archive...",

      filters: {
        all: "All",
        preDebut: "Pre-debut",
        stages: "Stages",
        variety: "Variety",
        behind: "Behind",
        events: "Events",
        awards: "Awards",
        musicVideos: "MV",
      },

      categoryNames: {
        "Pre-debut": "Pre-debut",
        Stages: "Stages",
        Variety: "Variety",
        Behind: "Behind",
        Events: "Events",
        Awards: "Awards",
        MV: "Official Music Videos",
      },

      collectionHeaders: {
        All: "ALL COLLECTIONS",
        "Pre-debut": "PRE-DEBUT COLLECTIONS",
        Stages: "STAGES COLLECTIONS",
        Variety: "VARIETY COLLECTIONS",
        Behind: "BEHIND THE SCENES COLLECTIONS",
        Events: "EVENT COLLECTIONS",
        Awards: "AWARDS COLLECTIONS",
        MV: "OFFICIAL MUSIC VIDEOS",
      },

      collectionSingular: "COLLECTION",
      collectionPlural: "COLLECTIONS",
      explore: "EXPLORE ↗",

      noCollectionsTitle: "No collections found.",
      noCollectionsDescription:
        "Try another search or category.",
      clearFilters: "CLEAR FILTERS",

      errorTitle: "Unable to load the archive.",
      errorDescription:
        "We could not retrieve the collections from the database. Please try again later.",
      collectionErrorTitle: "Unable to load collection",
      collectionVideosErrorTitle:
        "Unable to load collection videos",
      videosErrorTitle: "Unable to load videos",

      cataloguedVideos: "CATALOGUED VIDEOS",
      independentArchive: "Independent fan archive",
      videoDetails: "WATCH DETAILS ↗",
      sortLabel: "SORT BY PUBLICATION DATE",
      newestFirst: "Newest first",
      oldestFirst: "Oldest first",

      archiveGrowingTitle: "The archive is growing.",
      noPublishedVideos:
        "No published videos have been catalogued in this collection yet.",
      newEntriesSoon:
        "New entries will be added as the archive develops.",
      backToWatch: "← BACK TO WATCH",

      informationEyebrow: "MADE FOR THE FANS",
      informationTitle:
        "Every performance deserves a place.",
      informationDescription:
        "The archive organizes information and references to BABYMONSTER content. Videos are displayed through their original authorized sources.",

      footerDisclaimer:
        "MONSTER ARCHIVE · Independent fan-made project",
    },

    videoPage: {
      collectionErrorTitle: "Unable to load collection",
      videoErrorTitle: "Unable to load video",
      relationshipErrorTitle:
        "Unable to verify video collection",

      archiveLabel: "MONSTER ARCHIVE / WATCH",
      aboutVideo: "ABOUT THIS VIDEO",
      noDescription: "No description available.",

      videoInformation: "VIDEO INFORMATION",
      publicationDate: "PUBLICATION DATE",
      originalSource: "ORIGINAL SOURCE",
      archiveStatus: "ARCHIVE STATUS",
      published: "Published",

      watchOriginal: "WATCH ORIGINAL ON YOUTUBE ↗",
      backToCollection: "← BACK TO COLLECTION",
      footerDisclaimer:
        "MONSTER ARCHIVE · Independent fan-made project",
    },
  },

  "pt-BR": {
    navigation: {
      home: "Início",
      members: "Integrantes",
      watch: "Vídeos",
      about: "Sobre",
      globalArchive: "ARQUIVO GLOBAL DE FÃS",
      selectLanguage: "Selecionar idioma",
    },

    home: {
      heroEyebrow: "O ARQUIVO DEFINITIVO DO BABYMONSTER",
      heroLine1: "CADA ERA.",
      heroLine2: "CADA PALCO.",
      heroLine3: "CADA MEMÓRIA.",
      heroDescription:
        "Conheça a história, as músicas, as performances e os momentos marcantes do BABYMONSTER. Tudo em um só lugar, feito por fãs e para fãs.",
      heroImageAlt: "As sete integrantes do BABYMONSTER — Era DRIP",
      exploreArchive: "EXPLORAR O ARQUIVO →",
      aboutProject: "SOBRE O PROJETO",

      membersStat: "INTEGRANTES",
      memoriesStat: "MEMÓRIAS",
      communityValue: "GLOBAL",
      communityStat: "COMUNIDADE",

      discoverEyebrow: "DESCUBRA ALGO NOVO",
      catalogTitle: "Explore o arquivo",
      catalogDescription: "Todo momento tem uma história.",
      searchPlaceholder: "Pesquisar no arquivo...",

      filters: {
        all: "Todos",
        preDebut: "Pré-debut",
        stages: "Apresentações",
        variety: "Variedades",
        behind: "Bastidores",
        events: "Eventos",
        awards: "Premiações",
      },

      collectionSingular: "COLEÇÃO",
      collectionPlural: "COLEÇÕES",
      explore: "EXPLORAR ↗",

      noContentTitle: "Nenhum conteúdo encontrado.",
      noContentDescription:
        "Experimente outra pesquisa ou categoria.",
      clearFilters: "LIMPAR FILTROS",

      errorTitle: "Não foi possível carregar o arquivo.",
      errorDescription:
        "Não conseguimos recuperar as coleções. Atualize a página e tente novamente.",

      aboutEyebrow: "FEITO POR FÃS. PARA FÃS.",
      aboutTitle: "Um grupo. Um arquivo.",
      aboutSubtitle: "Um mundo de memórias.",
      aboutDescription:
        "Um projeto independente de fãs dedicado a preservar e organizar informações sobre o BABYMONSTER para fãs de todo o mundo.",

      footerDisclaimer:
        "Projeto independente feito por fãs. Sem afiliação com a YG Entertainment.",

      collectionContent: {
        "music-videos": {
          title: "Music Videos Oficiais",
          label: "VIDEOCLIPES OFICIAIS",
          description:
            "Videoclipes oficiais do BABYMONSTER e suas versões oficiais.",
        },
        "pre-debut": {
          title: "Antes da Estreia",
          label: "O COMEÇO",
          description:
            "Conheça a trajetória, as avaliações e os momentos que antecederam a estreia oficial.",
        },
        "music-show-stages": {
          title: "Apresentações e Performances",
          label: "PERFORMANCES AO VIVO",
          description:
            "Programas musicais, vídeos de apresentações oficiais e performances especiais.",
        },
        "variety-interviews": {
          title: "Variedades e Entrevistas",
          label: "FORA DOS PALCOS",
          description:
            "Explore programas de variedades, entrevistas, jogos e participações na televisão.",
        },
        "behind-the-scenes": {
          title: "Bastidores",
          label: "POR TRÁS DAS CÂMERAS",
          description:
            "Uma coleção dedicada aos momentos dos bastidores e documentários especiais.",
        },
        "live-events": {
          title: "Eventos e Festivais",
          label: "NO PALCO",
          description:
            "Shows, festivais, participações especiais e apresentações ao vivo.",
        },
        awards: {
          title: "Premiações e Apresentações Especiais",
          label: "MOMENTOS ESPECIAIS",
          description:
            "Cerimônias de premiação, indicações, vitórias e apresentações especiais.",
        },
      },
    },

    members: {
      eyebrow: "CONHEÇA AS INTEGRANTES",
      title: "AS INTEGRANTES",
      description:
        "Conheça as sete integrantes do BABYMONSTER. Explore suas histórias, performances, atividades e momentos inesquecíveis.",
      allMembers: "TODAS AS INTEGRANTES",
      memberCount: "INTEGRANTES",
      profileLink: "PERFIL DA INTEGRANTE",
      footerDisclaimer:
        "Projeto independente feito por fãs. Sem afiliação com a YG Entertainment.",
    },

    memberProfile: {
      archiveLabel: "ARQUIVO DA INTEGRANTE",
      exploreProfile: "EXPLORAR PERFIL",
      allMembers: "TODAS AS INTEGRANTES",
      profileDescription:
        "Explore o arquivo dedicado a {name}. Descubra apresentações, entrevistas, atividades e momentos marcantes ao longo da trajetória do BABYMONSTER.",

      informationEyebrow: "INFORMAÇÕES DA INTEGRANTE",
      aboutTitle: "SOBRE {name}",
      aboutDescription:
        "Este perfil é dedicado a organizar informações verificadas, conteúdos oficiais e registros do arquivo relacionados a {name}. Mais informações serão adicionadas conforme o arquivo evoluir.",

      performancesTitle: "APRESENTAÇÕES",
      performancesDescription:
        "Palcos e apresentações ao vivo",

      varietyTitle: "VARIEDADES",
      varietyDescription: "Programas e entrevistas",

      behindTitle: "BASTIDORES",
      behindDescription:
        "Conteúdos dos bastidores e materiais especiais",

      comingSoon: "CONTEÚDO EM BREVE",
      footerDisclaimer: "Projeto independente feito por fãs.",
    },

    watch: {
      heroEyebrow: "O ARQUIVO DE VÍDEOS DO BABYMONSTER",
      heroTitleLine1: "REVIVA",
      heroTitleLine2: "CADA MOMENTO.",
      heroDescription:
        "Explore apresentações, programas musicais, programas de variedades, entrevistas e momentos inesquecíveis da trajetória do BABYMONSTER.",
      exploreCatalogue: "EXPLORAR CATÁLOGO →",

      discoverEyebrow: "DESCUBRA O ARQUIVO",
      catalogTitle: "Explore as coleções",
      catalogDescription:
        "Encontre seus momentos favoritos do BABYMONSTER.",
      searchPlaceholder: "Pesquisar no arquivo...",

      filters: {
        all: "Todos",
        preDebut: "Pré-debut",
        stages: "Apresentações",
        variety: "Variedades",
        behind: "Bastidores",
        events: "Eventos",
        awards: "Premiações",
        musicVideos: "MV",
      },

      categoryNames: {
        "Pre-debut": "Pré-debut",
        Stages: "Apresentações",
        Variety: "Variedades",
        Behind: "Bastidores",
        Events: "Eventos",
        Awards: "Premiações",
        MV: "Videoclipes Oficiais",
      },

      collectionHeaders: {
        All: "TODAS AS COLEÇÕES",
        "Pre-debut": "COLEÇÕES PRÉ-DEBUT",
        Stages: "COLEÇÕES DE APRESENTAÇÕES",
        Variety: "COLEÇÕES DE VARIEDADES",
        Behind: "COLEÇÕES DE BASTIDORES",
        Events: "COLEÇÕES DE EVENTOS",
        Awards: "COLEÇÕES DE PREMIAÇÕES",
        MV: "COLEÇÃO DE MUSIC VIDEOS",
      },

      collectionSingular: "COLEÇÃO",
      collectionPlural: "COLEÇÕES",
      explore: "EXPLORAR ↗",

      noCollectionsTitle: "Nenhuma coleção encontrada.",
      noCollectionsDescription:
        "Experimente outra pesquisa ou categoria.",
      clearFilters: "LIMPAR FILTROS",

      errorTitle: "Não foi possível carregar o arquivo.",
      errorDescription:
        "Não conseguimos recuperar as coleções do banco de dados. Tente novamente mais tarde.",
      collectionErrorTitle:
        "Não foi possível carregar a coleção",
      collectionVideosErrorTitle:
        "Não foi possível carregar os vídeos da coleção",
      videosErrorTitle:
        "Não foi possível carregar os vídeos",

      cataloguedVideos: "VÍDEOS CATALOGADOS",
      independentArchive: "Arquivo independente de fãs",
      videoDetails: "VER DETALHES ↗",
      sortLabel: "ORDENAR POR DATA DE PUBLICAÇÃO",
      newestFirst: "Mais recentes primeiro",
      oldestFirst: "Mais antigos primeiro",

      archiveGrowingTitle: "O arquivo está crescendo.",
      noPublishedVideos:
        "Ainda não há vídeos publicados nesta coleção.",
      newEntriesSoon:
        "Novos registros serão adicionados conforme o arquivo evoluir.",
      backToWatch: "← VOLTAR AOS VÍDEOS",

      informationEyebrow: "FEITO PARA OS FÃS",
      informationTitle:
        "Toda apresentação merece um lugar.",
      informationDescription:
        "O arquivo organiza informações e referências sobre os conteúdos do BABYMONSTER. Os vídeos são exibidos por meio de suas fontes originais autorizadas.",

      footerDisclaimer:
        "MONSTER ARCHIVE · Projeto independente feito por fãs",
    },

    videoPage: {
      collectionErrorTitle:
        "Não foi possível carregar a coleção",
      videoErrorTitle:
        "Não foi possível carregar o vídeo",
      relationshipErrorTitle:
        "Não foi possível verificar a coleção do vídeo",

      archiveLabel: "MONSTER ARCHIVE / VÍDEOS",
      aboutVideo: "SOBRE ESTE VÍDEO",
      noDescription: "Descrição não disponível.",

      videoInformation: "INFORMAÇÕES DO VÍDEO",
      publicationDate: "DATA DE PUBLICAÇÃO",
      originalSource: "FONTE ORIGINAL",
      archiveStatus: "STATUS NO ARQUIVO",
      published: "Publicado",

      watchOriginal: "ASSISTIR ORIGINAL NO YOUTUBE ↗",
      backToCollection: "← VOLTAR À COLEÇÃO",
      footerDisclaimer:
        "MONSTER ARCHIVE · Projeto independente feito por fãs",
    },
  },
};
