import type { Locale } from "./config";

export const archiveSections = ["/members", "/watch", "/news", "/schedule"] as const;

type ProjectCopy = {
  about: {
    title: string;
    intro: string;
    archiveTitle: string;
    archiveDescriptions: Record<(typeof archiveSections)[number], string>;
    editorialTitle: string;
    editorialDescription: string;
    supportDescription: string;
    supportLink: string;
  };
  support: {
    title: string;
    intro: string;
    prioritiesTitle: string;
    priorities: { title: string; description: string }[];
    availabilityTitle: string;
    availabilityDescription: string;
  };
};

export const projectCopy = {
  en: {
    about: {
      title: "About the project",
      intro: "MONSTER ARCHIVE is an independent fan project that brings BABYMONSTER’s videos, news and events together in one place. The archive is available in English and Brazilian Portuguese.",
      archiveTitle: "Explore the archive",
      archiveDescriptions: {
        "/members": "Get to know the seven members and find content linked to each profile.",
        "/watch": "Browse music videos, performances, variety shows and behind-the-scenes footage.",
        "/news": "Read bilingual updates and follow the links to the original sources.",
        "/schedule": "See upcoming appearances and revisit published events in the group’s history.",
      },
      editorialTitle: "How we curate the archive",
      editorialDescription: "We organize videos by collection, era and member when that information is available. News and events go through editorial review before publication. Event dates follow the time zone of the venue or broadcast.",
      supportDescription: "Learn how voluntary contributions could help maintain the archive and improve its editorial tools.",
      supportLink: "See support goals",
    },
    support: {
      title: "Support the creator",
      intro: "The archive is open to everyone. Voluntary contributions could help keep the site running and give the project more room to grow.",
      prioritiesTitle: "What your support could help with",
      priorities: [
        { title: "Site maintenance", description: "Help cover hosting and the tools that keep the archive available." },
        { title: "Archive curation", description: "Support the work of organizing videos, checking sources and reviewing news and events in both languages." },
        { title: "Editorial tools", description: "One future goal is funding X API credits to help discover public appearances for editorial review." },
      ],
      availabilityTitle: "Contributions are currently unavailable",
      availabilityDescription: "You can already use the archive and share it with other BABYMONSTER fans.",
    },
  },
  "pt-BR": {
    about: {
      title: "Sobre o projeto",
      intro: "O MONSTER ARCHIVE é um projeto independente de fãs que reúne vídeos, notícias e eventos do BABYMONSTER em um só lugar. O acervo está disponível em português do Brasil e inglês.",
      archiveTitle: "Explore o acervo",
      archiveDescriptions: {
        "/members": "Conheça as sete integrantes e encontre conteúdos vinculados a cada perfil.",
        "/watch": "Explore videoclipes, apresentações, programas de variedades e bastidores.",
        "/news": "Leia notícias nos dois idiomas e acesse os links das fontes originais.",
        "/schedule": "Confira as próximas aparições e revisite os eventos publicados no histórico do grupo.",
      },
      editorialTitle: "Como organizamos o acervo",
      editorialDescription: "Organizamos os vídeos por coleção, era e integrante quando essas informações estão disponíveis. Notícias e eventos passam por revisão editorial antes da publicação. As datas dos eventos seguem o fuso horário do local ou da transmissão.",
      supportDescription: "Veja como contribuições voluntárias poderiam ajudar na manutenção do acervo e na melhoria das ferramentas editoriais.",
      supportLink: "Ver objetivos do apoio",
    },
    support: {
      title: "Apoie o criador",
      intro: "O acervo é aberto a todos. Contribuições voluntárias poderiam ajudar a manter o site no ar e ampliar o projeto.",
      prioritiesTitle: "O que o apoio pode viabilizar",
      priorities: [
        { title: "Manutenção do site", description: "Ajudar a cobrir a hospedagem e as ferramentas que mantêm o acervo disponível." },
        { title: "Curadoria do acervo", description: "Apoiar o trabalho de organizar vídeos, conferir fontes e revisar notícias e eventos nos dois idiomas." },
        { title: "Ferramentas editoriais", description: "Uma meta futura é custear créditos da API do X para encontrar aparições públicas e encaminhá-las para revisão editorial." },
      ],
      availabilityTitle: "Contribuições ainda estão indisponíveis",
      availabilityDescription: "Você já pode usar o acervo e compartilhá-lo com outros fãs do BABYMONSTER.",
    },
  },
} satisfies Record<Locale, ProjectCopy>;
