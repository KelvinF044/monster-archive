type LocaleKey = "en" | "pt-BR";

type BioSource = {
  label: string;
  url: string;
};

type LocalizedBio = {
  intro: string;
  earlyInterestTitle: string;
  earlyInterest: string;
  ygJourneyTitle: string;
  ygJourney: string;
  offStageTitle: string;
  offStage: string;
  highlightsTitle: string;
  highlights: string[];
  sources: BioSource[];
};

type Member = {
  slug: string;
  name: string;
  number: string;
  birthday: string;
  nationality: Record<LocaleKey, string>;
  gradient: string;
  bio: Record<LocaleKey, LocalizedBio>;
};

type LocalizedSource = Record<LocaleKey, BioSource>;

function makeSource(
  enLabel: string,
  ptLabel: string,
  url: string
): LocalizedSource {
  return {
    en: {
      label: enLabel,
      url,
    },
    "pt-BR": {
      label: ptLabel,
      url,
    },
  };
}

function makeSources(
  ...items: LocalizedSource[]
): Record<LocaleKey, BioSource[]> {
  return {
    en: items.map((item) => item.en),
    "pt-BR": items.map((item) => item["pt-BR"]),
  };
}

// ======================================================
// SHARED SOURCES
// ======================================================

const officialYG = makeSource(
  "YG Entertainment — Official Profile",
  "YG Entertainment — Perfil oficial",
  "https://ygfamily.com/en/artists/babymonster/profile"
);

const cnnInterview = makeSource(
  "CNN Brasil — Interview with all seven members",
  "CNN Brasil — Entrevista com as sete integrantes",
  "https://www.cnnbrasil.com.br/pop/rumo-ao-grammy-grupo-de-k-pop-babymonster-quer-conquistar-o-mundo/"
);

const vogueInterview = makeSource(
  "Vogue Hong Kong — BABYMONSTER Interview",
  "Vogue Hong Kong — Entrevista com BABYMONSTER",
  "https://www.voguehk.com/en/article/fashion/babymonster-cover-interview/"
);

const kprofilesOverview = makeSource(
  "KProfiles — Member profiles and fan reference",
  "KProfiles — Perfis das integrantes e referência de fãs",
  "https://kprofiles.com/babymonster-members-profile/"
);

const ygSelectCredits = makeSource(
  "YG SELECT — Official DRIP Album Credits",
  "YG SELECT — Créditos oficiais do álbum DRIP",
  "https://en.ygselect.com/board/focus/read.html?board_no=20&no=506657"
);

const ghostCredits = makeSource(
  "BABYMONSTER — Official GHOST Audio Credits",
  "BABYMONSTER — Créditos oficiais de GHOST",
  "https://www.youtube.com/watch?v=y3FgAAgMR2A"
);

// ======================================================
// RUKA SOURCES
// ======================================================

const rukaSoompi = makeSource(
  "Soompi — Introducing RUKA",
  "Soompi — Apresentação de RUKA",
  "https://www.soompi.com/article/1565867wpp/watch-ygs-new-girl-group-babymonster-introduces-member-ruka-with-audition-footage-interview-with-yang-hyun-suk-and-more"
);

const rukaKJD = makeSource(
  "Korea JoongAng Daily — Who is RUKA?",
  "Korea JoongAng Daily — Quem é RUKA?",
  "https://www.koreajoongangdaily.com/entertainment/who-is-ruka/12768173"
);

const rukaKprofiles = makeSource(
  "KProfiles — RUKA Profile and Facts",
  "KProfiles — Perfil e curiosidades sobre RUKA",
  "https://kprofiles.com/ruka-babymonster-profile-and-facts/"
);

const elleInterview = makeSource(
  "ELLE Singapore — BABYMONSTER Digital Cover",
  "ELLE Singapore — Entrevista BABYMONSTER",
  "https://elle.com.sg/life-culture/babymonster-digital-cover-november-2024/"
);

const rukaSources = makeSources(
  officialYG,
  rukaSoompi,
  rukaKJD,
  cnnInterview,
  elleInterview,
  ygSelectCredits,
  ghostCredits,
  rukaKprofiles
);

// ======================================================
// ASA SOURCES
// ======================================================

const asaYG = makeSource(
  "YG LIFE — ASA: Multi-talented ACE",
  "YG LIFE — ASA: Artista multitalentosa",
  "https://yg-life.com/archives/181569?lang=en"
);

const asaSoompi = makeSource(
  "Soompi — Introducing ASA",
  "Soompi — Apresentação de ASA",
  "https://www.soompi.com/article/1567292wpp/watch-ygs-new-girl-group-babymonster-spotlights-japanese-member-asa-in-new-introduction-video"
);

const asaKprofiles = makeSource(
  "KProfiles — ASA Profile and Facts",
  "KProfiles — Perfil e curiosidades sobre ASA",
  "https://kprofiles.com/asa-babymonster-profile-and-facts/"
);

const batterUpCredits = makeSource(
  "YG LIFE — BATTER UP Official Credits",
  "YG LIFE — Créditos oficiais de BATTER UP",
  "https://yg-life.com/archives/185946?lang=en"
);

const asaInterview = makeSource(
  "Woody World — BABYMONSTER In-depth Interview",
  "Woody World — Entrevista aprofundada com BABYMONSTER",
  "https://woodyworld.co/en/babymonster-opens-up-in-depth-for-the-first-time-who-is-the-best-at-shopping/"
);

const asaSources = makeSources(
  officialYG,
  asaYG,
  asaSoompi,
  cnnInterview,
  batterUpCredits,
  ygSelectCredits,
  ghostCredits,
  asaInterview,
  asaKprofiles
);

// ======================================================
// PHARITA SOURCES
// ======================================================

const pharitaSBS = makeSource(
  "SBS Star — PHARITA's YG Journey",
  "SBS Star — Trajetória de PHARITA na YG",
  "https://news.sbs.co.kr/amp/news.amp?news_id=N1007083236"
);

const pharitaKprofiles = makeSource(
  "KProfiles — PHARITA Profile and Facts",
  "KProfiles — Perfil e curiosidades sobre PHARITA",
  "https://kprofiles.com/pharita-babymonster-profile/"
);

const pharitaSources = makeSources(
  officialYG,
  pharitaSBS,
  cnnInterview,
  vogueInterview,
  pharitaKprofiles,
  kprofilesOverview
);

// ======================================================
// AHYEON SOURCES
// ======================================================

const ahyeonSoompi = makeSource(
  "Soompi — Introducing AHYEON",
  "Soompi — Apresentação de AHYEON",
  "https://www.soompi.com/article/1568925wpp/watch-ygs-new-girl-group-babymonster-introduces-15-year-old-member-ahyeon-with-footage-from-audition-and-trainee-days"
);

const ahyeonReturn = makeSource(
  "YG Entertainment — AHYEON's Return Announcement",
  "YG Entertainment — Comunicado sobre o retorno de AHYEON",
  "https://ygfamily.com/en/news/report/5717"
);

const ahyeonHanlim = makeSource(
  "SBS Star — AHYEON at Hanlim Arts School",
  "SBS Star — AHYEON na Hanlim Arts School",
  "https://news.sbs.co.kr/news/endPagePrintPopup.do?news_id=N1007101101"
);

const ahyeonKprofiles = makeSource(
  "KProfiles — AHYEON Profile and Facts",
  "KProfiles — Perfil e curiosidades sobre AHYEON",
  "https://kprofiles.com/ahyeon-babymonster-profile/"
);

const ahyeonSources = makeSources(
  officialYG,
  ahyeonSoompi,
  ahyeonReturn,
  ahyeonHanlim,
  cnnInterview,
  vogueInterview,
  ahyeonKprofiles
);

// ======================================================
// RAMI SOURCES
// ======================================================

const ramiSBS = makeSource(
  "SBS Star — RAMI's Childhood and Family Story",
  "SBS Star — Infância e história familiar de RAMI",
  "https://news.sbs.co.kr/amp/news.amp?news_id=N1007868749"
);

const ramiKprofiles = makeSource(
  "KProfiles — RAMI Profile and Facts",
  "KProfiles — Perfil e curiosidades sobre RAMI",
  "https://kprofiles.com/rami-babymonster-profile/"
);

const joongAngRami = makeSource(
  "Korea JoongAng Daily — BABYMONSTER's Name Changes",
  "Korea JoongAng Daily — Mudanças de nomes no BABYMONSTER",
  "https://www.koreajoongangdaily.com/entertainment/one-gone-one-renamed-six-members-of-babymonster-gear-up-for-debut/10115947"
);

const ramiSources = makeSources(
  officialYG,
  ramiSBS,
  cnnInterview,
  joongAngRami,
  ramiKprofiles,
  kprofilesOverview
);

// ======================================================
// RORA SOURCES
// ======================================================

const roraSoompi = makeSource(
  "Soompi — Introducing RORA",
  "Soompi — Apresentação de RORA",
  "https://www.soompi.com/article/1566840wpp/watch-ygs-new-girl-group-babymonster-introduces-14-year-old-member-rora-with-footage-from-audition-and-trainee-days"
);

const roraKprofiles = makeSource(
  "KProfiles — RORA Profile and Facts",
  "KProfiles — Perfil e curiosidades sobre RORA",
  "https://kprofiles.com/rora-babymonster-profile/"
);

const roraSources = makeSources(
  officialYG,
  roraSoompi,
  cnnInterview,
  elleInterview,
  roraKprofiles,
  kprofilesOverview
);

// ======================================================
// CHIQUITA SOURCES
// ======================================================

const chiquitaSoompi = makeSource(
  "Soompi — Introducing CHIQUITA",
  "Soompi — Apresentação de CHIQUITA",
  "https://www.soompi.com/article/1568154wpp/watch-ygs-new-girl-group-babymonster-introduces-13-year-old-chiquita-from-thailand-with-glimpse-of-her-trainee-days"
);

const chiquitaYG = makeSource(
  "YG LIFE — CHIQUITA: The Fearless Youngest Trainee",
  "YG LIFE — CHIQUITA: A trainee mais jovem e destemida",
  "https://yg-life.com/archives/181628?lang=en"
);

const chiquitaKprofiles = makeSource(
  "KProfiles — CHIQUITA Profile and Facts",
  "KProfiles — Perfil e curiosidades sobre CHIQUITA",
  "https://kprofiles.com/chiquita-babymonster-profile-and-facts/"
);

const chiquitaSources = makeSources(
  officialYG,
  chiquitaYG,
  chiquitaSoompi,
  cnnInterview,
  vogueInterview,
  chiquitaKprofiles
);

// ======================================================
// MEMBERS
// ======================================================

export const members = [
  // ====================================================
  // RUKA
  // ====================================================

  {
    slug: "ruka",
    name: "RUKA",
    number: "01",
    birthday: "2002-03-20",

    nationality: {
      en: "Japanese",
      "pt-BR": "Japonesa",
    },

    gradient: "from-purple-950 via-violet-900 to-black",

    bio: {
      en: {
        intro:
          "RUKA is BABYMONSTER's eldest member and one of its most experienced performers. Born in Yamaguchi, Japan, she developed a strong connection with hip-hop dance during childhood. Her artistic path later expanded into rap, vocals and songwriting.",

        earlyInterestTitle: "A dancer since childhood",
        earlyInterest:
          "RUKA has said that she started learning dance during her first year of elementary school. Hip-hop quickly became one of her greatest passions, and performing on stage became an important part of her identity. Her early introduction to YG also revealed how much her family's support, especially her mother's encouragement, meant to her during the long journey toward debut.",

        ygJourneyTitle: "Five years of preparation at YG",
        ygJourney:
          "Footage from RUKA's YG audition dates back to 2018. According to Korea JoongAng Daily, she trained at YG Entertainment for approximately five years, the longest training period among the members. RUKA explained that singing and rap were skills she developed after becoming a trainee, allowing her to express herself beyond dance.",

        offStageTitle: "Hip-hop, friendship and everyday life",
        offStage:
          "RUKA has described hip-hop as a way to express her charisma and personality. Outside performances, she enjoys Pilates and spending time with the other members. Interviews and member profiles also describe her playful side, including her habit of sharing funny moments and making the other girls laugh.",

        highlightsTitle: "Artistic achievements",
        highlights: [
          "Has official lyricist credits on BABYMONSTER's 'Love In My Heart', 'Woke Up In Tokyo' and 'Ghost'.",
          "Shares the unit track 'Woke Up In Tokyo' with ASA, featuring their Japanese and English rap styles.",
          "Completed approximately five years of YG training before the group's official seven-member debut.",
          "Her early hip-hop dance experience became a foundation for her role as one of the group's main rap performers.",
        ],

        sources: rukaSources.en,
      },

      "pt-BR": {
        intro:
          "RUKA é a integrante mais velha do BABYMONSTER e uma das artistas com maior experiência em apresentações. Nascida em Yamaguchi, no Japão, desenvolveu uma forte conexão com a dança hip-hop ainda na infância. Sua trajetória artística posteriormente se expandiu para o rap, o canto e a composição de letras.",

        earlyInterestTitle: "Uma dançarina desde a infância",
        earlyInterest:
          "RUKA contou que começou a aprender dança durante o primeiro ano do ensino fundamental. O hip-hop rapidamente se tornou uma de suas maiores paixões, e se apresentar nos palcos passou a fazer parte de sua identidade. Seu primeiro vídeo de apresentação na YG também revelou o quanto o apoio da família, especialmente o incentivo de sua mãe, significou durante a longa trajetória até o debut.",

        ygJourneyTitle: "Cinco anos de preparação na YG",
        ygJourney:
          "As imagens de sua audição na YG remontam a 2018. Segundo o Korea JoongAng Daily, RUKA treinou na YG Entertainment por aproximadamente cinco anos, o período mais longo entre as integrantes. Ela explicou que o canto e o rap foram habilidades desenvolvidas depois de se tornar trainee, permitindo que expressasse sua personalidade para além da dança.",

        offStageTitle: "Hip-hop, amizade e vida cotidiana",
        offStage:
          "RUKA já descreveu o hip-hop como uma forma de expressar seu carisma e sua personalidade. Fora das apresentações, gosta de praticar Pilates e passar tempo com as outras integrantes. Entrevistas e perfis também mostram seu lado brincalhão, incluindo o hábito de compartilhar momentos engraçados e fazer as outras meninas rirem.",

        highlightsTitle: "Conquistas artísticas",
        highlights: [
          "Possui créditos oficiais como letrista em 'Love In My Heart', 'Woke Up In Tokyo' e 'Ghost', do BABYMONSTER.",
          "Divide com ASA a faixa unitária 'Woke Up In Tokyo', que explora os estilos de rap das duas integrantes em japonês e inglês.",
          "Concluiu aproximadamente cinco anos de treinamento na YG antes da estreia oficial do grupo com sete integrantes.",
          "Sua experiência com dança hip-hop desde a infância se tornou uma das bases de sua atuação como rapper e performer do grupo.",
        ],

        sources: rukaSources["pt-BR"],
      },
    },
  },

  // ====================================================
  // PHARITA
  // ====================================================

  {
    slug: "pharita",
    name: "PHARITA",
    number: "02",
    birthday: "2005-08-26",

    nationality: {
      en: "Thai",
      "pt-BR": "Tailandesa",
    },

    gradient: "from-pink-950 via-rose-900 to-black",

    bio: {
      en: {
        intro:
          "PHARITA is BABYMONSTER's Thai vocalist, born in Bangkok. Before joining YG Entertainment, she had already experienced modeling and public competitions in Thailand. Her journey combines an international background, a dream of performing and a strong admiration for YG artists.",

        earlyInterestTitle: "A childhood connected to the arts",
        earlyInterest:
          "Born in Bangkok, Thailand, PHARITA participated in child modeling and competitions before beginning her path in K-pop. Public member profiles also record her studies at Ruamrudee International School. She has shared that music was part of her life from an early age, and that watching YG artists helped her imagine becoming a performer herself.",

        ygJourneyTitle: "From a global audition to Seoul",
        ygJourney:
          "PHARITA joined YG Entertainment through a global audition in 2020. SBS reported that the selection was extremely competitive, with approximately 1,226 applicants for each available trainee spot. She moved from Thailand to Korea to pursue her dream, and has spoken openly about how challenging training could be while trying to find enjoyable moments in her daily routine.",

        offStageTitle: "Curiosity, walks and inspiration",
        offStage:
          "PHARITA has mentioned enjoying long walks, discovering new places and going shopping with the other members. She speaks Thai and English and has continued developing her Korean. BLACKPINK's LISA is one of her most important role models, especially because of the confidence and stage presence she brings to performances.",

        highlightsTitle: "Career and personal milestones",
        highlights: [
          "Entered YG Entertainment through a highly competitive global audition in 2020.",
          "Moved from Thailand to Korea while still young to pursue her goal of becoming an artist.",
          "Identified LISA of BLACKPINK as an important role model and inspiration for her stage ambitions.",
          "In a 2026 interview, chose the lyric 'I'm getting stronger' from 'DREAM' as a line that reflects her own personal growth.",
        ],

        sources: pharitaSources.en,
      },

      "pt-BR": {
        intro:
          "PHARITA é a vocalista tailandesa do BABYMONSTER, nascida em Bangkok. Antes de entrar na YG Entertainment, já havia tido experiências com modelagem e concursos em seu país. Sua trajetória reúne uma formação internacional, o sonho de se apresentar nos palcos e uma grande admiração pelos artistas da YG.",

        earlyInterestTitle: "Uma infância ligada às artes",
        earlyInterest:
          "Nascida em Bangkok, na Tailândia, PHARITA participou de atividades de modelagem infantil e concursos antes de iniciar sua trajetória no K-pop. Perfis públicos das integrantes também registram seus estudos na Ruamrudee International School. Ela contou que a música fazia parte de sua vida desde pequena e que assistir aos artistas da YG a ajudou a imaginar que também poderia se tornar uma performer.",

        ygJourneyTitle: "De uma audição global até Seul",
        ygJourney:
          "PHARITA entrou na YG Entertainment através de uma audição global em 2020. A SBS informou que a seleção foi extremamente concorrida, com aproximadamente 1.226 candidatos para cada vaga disponível de trainee. Ela saiu da Tailândia e foi para a Coreia ainda jovem para perseguir seu sonho, e já comentou sobre os desafios do treinamento e a importância de encontrar momentos divertidos na rotina.",

        offStageTitle: "Curiosidade, passeios e inspiração",
        offStage:
          "PHARITA já comentou que gosta de fazer caminhadas, conhecer lugares novos e sair para fazer compras com as outras integrantes. Ela fala tailandês e inglês e continuou desenvolvendo seu coreano. LISA, do BLACKPINK, é uma de suas principais referências, especialmente pela confiança e presença de palco que demonstra em suas apresentações.",

        highlightsTitle: "Trajetória e conquistas pessoais",
        highlights: [
          "Entrou na YG Entertainment através de uma audição global altamente concorrida em 2020.",
          "Mudou-se da Tailândia para a Coreia ainda jovem para perseguir o objetivo de se tornar artista.",
          "Apontou LISA, do BLACKPINK, como uma de suas principais referências e inspirações para sua carreira nos palcos.",
          "Em uma entrevista de 2026, escolheu o verso 'I'm getting stronger', da música 'DREAM', como uma frase que representa seu próprio crescimento.",
        ],

        sources: pharitaSources["pt-BR"],
      },
    },
  },

  // ====================================================
  // ASA
  // ====================================================

  {
    slug: "asa",
    name: "ASA",
    number: "03",
    birthday: "2006-04-17",

    nationality: {
      en: "Japanese",
      "pt-BR": "Japonesa",
    },

    gradient: "from-blue-950 via-indigo-900 to-black",

    bio: {
      en: {
        intro:
          "ASA is BABYMONSTER's Japanese rapper, dancer and songwriter. Born in Tokyo, she developed an early interest in performance and later became one of the group's most recognized creative contributors. Her combination of rap, dance and songwriting gives her a distinctive place in the group.",

        earlyInterestTitle: "From musical theater to dance",
        earlyInterest:
          "ASA was born in Tokyo and public member profiles describe her as the youngest of three sisters, with two older sisters. Her early artistic experiences included participation in the LADYBIRD Green Musical in Japan. She later said that attending a dance school during her first year of high school helped her discover how much she loved music and performing.",

        ygJourneyTitle: "A determined trainee with a curious mind",
        ygJourney:
          "ASA pursued a YG audition because she was attracted to the company's hip-hop style and was determined to become a K-pop artist. YG's introduction highlighted her habit of asking many questions during training. Dance trainer LEEJUNG praised her attitude, explaining that her curiosity helped her understand details quickly and develop strong musical and performance skills.",

        offStageTitle: "Writing, producing and staying connected",
        offStage:
          "ASA has shared that she enjoys writing lyrics and creating music in her free time. This interest has become an important part of her identity beyond performing. During interviews, she has also talked about calling her parents when she feels homesick, showing how important her family connection remains while living and working in Korea.",

        highlightsTitle: "A growing role in music creation",
        highlights: [
          "Co-wrote the lyrics and co-composed BABYMONSTER's debut digital single 'BATTER UP', released in November 2023.",
          "Has official lyricist credits on 'Love In My Heart', 'Woke Up In Tokyo' and 'Ghost'.",
          "Performed 'Look Alive' in her individual YG introduction video, giving fans an early showcase of her rap ability.",
          "Shares 'Woke Up In Tokyo' with RUKA, a unit track that highlights both members' rap styles and Japanese-language wordplay.",
        ],

        sources: asaSources.en,
      },

      "pt-BR": {
        intro:
          "ASA é a rapper, dançarina e compositora japonesa do BABYMONSTER. Nascida em Tóquio, desenvolveu desde cedo o interesse por apresentações artísticas e posteriormente se tornou uma das integrantes com maior participação criativa na música do grupo. Sua combinação de rap, dança e composição dá a ela uma identidade própria dentro do BABYMONSTER.",

        earlyInterestTitle: "Do teatro musical à dança",
        earlyInterest:
          "ASA nasceu em Tóquio e perfis públicos das integrantes a descrevem como a caçula de três irmãs, com duas irmãs mais velhas. Suas primeiras experiências artísticas incluem a participação no musical japonês LADYBIRD Green Musical. Mais tarde, ela contou que frequentar uma escola de dança durante o primeiro ano do ensino médio foi importante para descobrir o quanto gostava de música e de se apresentar.",

        ygJourneyTitle: "Uma trainee determinada e curiosa",
        ygJourney:
          "ASA buscou uma audição na YG porque se identificava com o estilo hip-hop da empresa e estava determinada a se tornar uma artista de K-pop. No vídeo de apresentação da YG, foi destacado seu hábito de fazer muitas perguntas durante os treinamentos. A professora de dança LEEJUNG elogiou sua atitude e explicou que sua curiosidade ajudava a compreender rapidamente os detalhes e a desenvolver suas habilidades musicais e de performance.",

        offStageTitle: "Composição, produção e conexão familiar",
        offStage:
          "ASA já compartilhou que gosta de escrever letras e criar músicas em seu tempo livre. Esse interesse se tornou uma parte importante de sua identidade para além das apresentações. Durante entrevistas, também comentou que costuma ligar para os pais quando sente saudade de casa, demonstrando como a conexão com sua família continua importante enquanto vive e trabalha na Coreia.",

        highlightsTitle: "Uma participação crescente na criação musical",
        highlights: [
          "Coescreveu a letra e participou da composição musical do single de estreia do BABYMONSTER, 'BATTER UP', lançado em novembro de 2023.",
          "Possui créditos oficiais como letrista em 'Love In My Heart', 'Woke Up In Tokyo' e 'Ghost'.",
          "Apresentou 'Look Alive' em seu vídeo individual de apresentação na YG, mostrando ao público suas habilidades de rap.",
          "Divide com RUKA a faixa 'Woke Up In Tokyo', que destaca os estilos de rap das duas integrantes e jogos de palavras em japonês.",
        ],

        sources: asaSources["pt-BR"],
      },
    },
  },

  // ====================================================
  // AHYEON
  // ====================================================

  {
    slug: "ahyeon",
    name: "AHYEON",
    number: "04",
    birthday: "2007-04-11",

    nationality: {
      en: "South Korean",
      "pt-BR": "Sul-coreana",
    },

    gradient: "from-red-950 via-red-900 to-black",

    bio: {
      en: {
        intro:
          "AHYEON is a South Korean member of BABYMONSTER known for her versatility as a singer, rapper and dancer. Born in Chuncheon, she developed a connection with music from childhood and became one of the group's most recognizable performers through her expressive stage presence.",

        earlyInterestTitle: "Music has always been part of her life",
        earlyInterest:
          "AHYEON has said that she loved music and dancing from a very young age. Whenever a song started playing, she naturally wanted to move. Public member profiles identify Chuncheon, South Korea, as her birthplace and mention that she has a younger brother. Her interest in music continued through her school years and performing activities.",

        ygJourneyTitle: "Audition, training and the seven-member lineup",
        ygJourney:
          "YG's official introduction video included footage from AHYEON's audition and trainee period. She participated in the group's pre-debut journey and Last Evaluation. After a period away from activities, YG officially announced her return on January 25, 2024, confirming that she would participate in recording the group's first mini-album and complete the seven-member lineup.",

        offStageTitle: "Curiosity and musical exploration",
        offStage:
          "AHYEON describes herself as curious and interested in trying different things. She has expressed a desire to explore musical styles beyond the genres she already performs. In a 2026 interview, she also said that she would enjoy preparing covers in different languages, showing her interest in connecting with fans through music.",

        highlightsTitle: "Versatility on stage",
        highlights: [
          "Recognized for combining singing, rap and dance in her performances, making her one of the group's most versatile stage performers.",
          "YG specifically highlighted the rap sections performed by AHYEON, ASA and RUKA in 'SHEESH'.",
          "Her return was officially announced by YG on January 25, 2024, confirming her participation in the first mini-album.",
          "Her inclusion completed the seven-member lineup that debuted with 'BABYMONS7ER' in April 2024.",
        ],

        sources: ahyeonSources.en,
      },

      "pt-BR": {
        intro:
          "AHYEON é uma integrante sul-coreana do BABYMONSTER, conhecida por sua versatilidade como cantora, rapper e dançarina. Nascida em Chuncheon, desenvolveu uma conexão com a música desde a infância e se tornou uma das performers mais reconhecidas do grupo por sua presença expressiva nos palcos.",

        earlyInterestTitle: "A música sempre fez parte de sua vida",
        earlyInterest:
          "AHYEON contou que gosta de música e dança desde muito pequena. Sempre que uma música começava a tocar, naturalmente sentia vontade de se movimentar. Perfis públicos das integrantes identificam Chuncheon, na Coreia do Sul, como sua cidade natal e mencionam que ela tem um irmão mais novo. Seu interesse pela música continuou durante os anos escolares e as experiências com apresentações.",

        ygJourneyTitle: "Audição, treinamento e formação de sete integrantes",
        ygJourney:
          "O vídeo oficial de apresentação da YG inclui imagens da audição e do período de treinamento de AHYEON. Ela participou da trajetória pré-debut do grupo e do Last Evaluation. Depois de um período afastada das atividades, a YG anunciou oficialmente seu retorno em 25 de janeiro de 2024, confirmando sua participação nas gravações do primeiro miniálbum e completando a formação de sete integrantes.",

        offStageTitle: "Curiosidade e exploração musical",
        offStage:
          "AHYEON se descreve como uma pessoa curiosa e interessada em experimentar coisas diferentes. Ela já demonstrou vontade de explorar estilos musicais além daqueles que costuma apresentar. Em uma entrevista de 2026, também comentou que gostaria de preparar covers em diferentes idiomas, mostrando seu interesse em se conectar com os fãs através da música.",

        highlightsTitle: "Versatilidade nos palcos",
        highlights: [
          "Reconhecida por combinar canto, rap e dança em suas apresentações, sendo uma das performers mais versáteis do grupo.",
          "A YG destacou especificamente as partes de rap interpretadas por AHYEON, ASA e RUKA em 'SHEESH'.",
          "Seu retorno foi anunciado oficialmente pela YG em 25 de janeiro de 2024, confirmando sua participação no primeiro miniálbum.",
          "Sua inclusão completou a formação de sete integrantes que estreou com 'BABYMONS7ER' em abril de 2024.",
        ],

        sources: ahyeonSources["pt-BR"],
      },
    },
  },

  // ====================================================
  // RAMI
  // ====================================================

  {
    slug: "rami",
    name: "RAMI",
    number: "05",
    birthday: "2007-10-17",

    nationality: {
      en: "South Korean",
      "pt-BR": "Sul-coreana",
    },

    gradient: "from-emerald-950 via-teal-900 to-black",

    bio: {
      en: {
        intro:
          "RAMI is a South Korean vocalist of BABYMONSTER, first introduced to the public under the name HARAM. Her story began in front of the cameras long before her K-pop debut, and her development as a singer and dancer took shape during her years at YG Entertainment.",

        earlyInterestTitle: "A childhood in front of the cameras",
        earlyInterest:
          "RAMI revealed that she began working as a child model at just two years old and continued until she was around twelve. Her entry into the entertainment industry happened naturally during this period. In an interview with SBS, she also shared that her mother had nearly debuted in a girl group and had participated in a pre-debut team, making music and performance part of her family's story.",

        ygJourneyTitle: "From HARAM to RAMI",
        ygJourney:
          "RAMI explained that she learned singing and dancing after joining YG Entertainment. As she developed those skills, she became increasingly certain that she wanted to become an artist. Before debut, she was introduced to the public as HARAM. Her later stage name, RAMI, came from a nickname used by the other members.",

        offStageTitle: "Musical references and a curious personality",
        offStage:
          "RAMI has shown admiration for artists such as BLACKPINK's ROSÉ and AKMU's Lee Suhyun. Public member profiles also describe her as someone who enjoys sports, dancing and taking on new challenges. Her experience in front of the camera from an early age gave her a different starting point from members who discovered performance during trainee life.",

        highlightsTitle: "A distinctive path to debut",
        highlights: [
          "Worked as a child model from approximately age two to twelve, before entering the K-pop training system.",
          "Her mother shared a particularly interesting family story: she had once been part of a girl group's pre-debut team.",
          "Was first introduced to BABYMONSTER fans under the name HARAM before adopting the stage name RAMI.",
          "Developed her singing and dancing skills at YG, where she discovered her determination to become a professional artist.",
        ],

        sources: ramiSources.en,
      },

      "pt-BR": {
        intro:
          "RAMI é uma vocalista sul-coreana do BABYMONSTER, apresentada inicialmente ao público com o nome HARAM. Sua história começou diante das câmeras muito antes de sua estreia no K-pop, e seu desenvolvimento como cantora e dançarina aconteceu durante os anos de treinamento na YG Entertainment.",

        earlyInterestTitle: "Uma infância diante das câmeras",
        earlyInterest:
          "RAMI revelou que começou a trabalhar como modelo infantil aos dois anos de idade e continuou até aproximadamente os doze. Sua entrada no mundo do entretenimento aconteceu naturalmente durante esse período. Em uma entrevista à SBS, ela também contou que sua mãe quase estreou em um grupo feminino e chegou a participar de uma equipe pré-debut, tornando a música e as apresentações parte da história de sua família.",

        ygJourneyTitle: "De HARAM a RAMI",
        ygJourney:
          "RAMI explicou que começou a aprender canto e dança depois de entrar na YG Entertainment. Conforme desenvolvia essas habilidades, passou a ter cada vez mais certeza de que queria se tornar artista. Antes do debut, foi apresentada ao público como HARAM. Seu nome artístico posterior, RAMI, surgiu de um apelido utilizado pelas outras integrantes.",

        offStageTitle: "Referências musicais e personalidade curiosa",
        offStage:
          "RAMI já demonstrou admiração por artistas como ROSÉ, do BLACKPINK, e Lee Suhyun, do AKMU. Perfis públicos das integrantes também a descrevem como alguém que gosta de esportes, dança e de aceitar novos desafios. Sua experiência diante das câmeras desde a infância deu a ela um ponto de partida diferente das integrantes que descobriram as apresentações durante a vida de trainee.",

        highlightsTitle: "Uma trajetória particular até a estreia",
        highlights: [
          "Trabalhou como modelo infantil aproximadamente dos dois aos doze anos, antes de entrar no sistema de treinamento do K-pop.",
          "Sua mãe compartilhou uma história familiar curiosa: ela já havia integrado uma equipe pré-debut de um grupo feminino.",
          "Foi apresentada inicialmente aos fãs do BABYMONSTER com o nome HARAM, antes de adotar o nome artístico RAMI.",
          "Desenvolveu suas habilidades de canto e dança na YG, onde descobriu sua determinação de se tornar uma artista profissional.",
        ],

        sources: ramiSources["pt-BR"],
      },
    },
  },

  // ====================================================
  // RORA
  // ====================================================

  {
    slug: "rora",
    name: "RORA",
    number: "06",
    birthday: "2008-08-14",

    nationality: {
      en: "South Korean",
      "pt-BR": "Sul-coreana",
    },

    gradient: "from-amber-950 via-orange-900 to-black",

    bio: {
      en: {
        intro:
          "RORA is a South Korean vocalist of BABYMONSTER, born in Gangneung. Her connection with the entertainment world began during childhood, when she participated in children's entertainment projects before joining YG. Today, she is recognized for her expressive vocals and calm but confident personality.",

        earlyInterestTitle: "An artist since childhood",
        earlyInterest:
          "Before becoming known as RORA, she had experiences as a child model and actress and was part of the children's group U.SSO Girl under the stage name U.ha. Public member profiles also identify Gangneung as her birthplace and mention a younger brother. Alongside PHARITA and CHIQUITA, she has said that watching YG artists perform helped inspire her early dream of becoming a singer.",

        ygJourneyTitle: "A place in the final seven",
        ygJourney:
          "RORA's official YG introduction included footage from her audition and trainee days. During the Last Evaluation, she was initially not included in the first five members selected by YG. After strong public support for all seven trainees, the company reconsidered its decision, and RORA and ASA were added to the final lineup. Their inclusion helped create the seven-member group fans know today.",

        offStageTitle: "Piano, school and time with the members",
        offStage:
          "RORA's musical interests extend beyond singing: member profiles identify piano as one of her specialties. In an interview with ELLE Singapore, she described life at an arts high school, where friends played instruments such as drums and piano and learned from one another. She also said she would like to learn guitar and that sharing meals with the other members is one of her happiest moments.",

        highlightsTitle: "From child performer to vocalist",
        highlights: [
          "Had earlier experience in children's entertainment, including the group U.SSO Girl under the name U.ha.",
          "Was one of the two trainees added to the final seven-member lineup after fans strongly supported the inclusion of all seven candidates.",
          "Her expressive and soulful vocal qualities were highlighted by Korea JoongAng Daily during the group's pre-debut period.",
          "Has shared her interest in learning other instruments, especially guitar, alongside her piano experience.",
        ],

        sources: roraSources.en,
      },

      "pt-BR": {
        intro:
          "RORA é uma vocalista sul-coreana do BABYMONSTER, nascida em Gangneung. Sua conexão com o mundo artístico começou ainda na infância, quando participou de projetos de entretenimento infantil antes de entrar na YG. Atualmente, é reconhecida por seus vocais expressivos e por sua personalidade tranquila, mas confiante.",

        earlyInterestTitle: "Uma artista desde a infância",
        earlyInterest:
          "Antes de ser conhecida como RORA, ela teve experiências como modelo e atriz infantil e integrou o grupo infantil U.SSO Girl com o nome artístico U.ha. Perfis públicos das integrantes também identificam Gangneung como sua cidade natal e mencionam que ela tem um irmão mais novo. Ao lado de PHARITA e CHIQUITA, ela contou que assistir aos artistas da YG se apresentando ajudou a inspirar seu sonho de se tornar cantora ainda pequena.",

        ygJourneyTitle: "Um lugar na formação final de sete",
        ygJourney:
          "O vídeo oficial de apresentação de RORA pela YG incluiu imagens de sua audição e dos dias de treinamento. Durante o Last Evaluation, ela inicialmente não foi incluída entre as cinco primeiras integrantes selecionadas pela empresa. Após uma forte mobilização dos fãs em favor das sete trainees, a YG reconsiderou a decisão, e RORA e ASA foram adicionadas à formação final. A participação das duas ajudou a formar o grupo de sete integrantes que conhecemos hoje.",

        offStageTitle: "Piano, escola e momentos com as integrantes",
        offStage:
          "Os interesses musicais de RORA vão além do canto: perfis das integrantes apontam o piano como uma de suas especialidades. Em entrevista à ELLE Singapore, ela descreveu a rotina em uma escola de artes, onde suas amigas tocavam instrumentos como bateria e piano e compartilhavam conhecimentos. Também comentou que gostaria de aprender violão e que fazer refeições com as outras integrantes está entre seus momentos mais felizes.",

        highlightsTitle: "De artista infantil a vocalista",
        highlights: [
          "Teve experiências anteriores no entretenimento infantil, incluindo a participação no grupo U.SSO Girl com o nome U.ha.",
          "Foi uma das duas trainees adicionadas à formação final de sete integrantes depois que os fãs demonstraram forte apoio às sete candidatas.",
          "Seus vocais expressivos e marcantes foram destacados pelo Korea JoongAng Daily durante o período pré-debut do grupo.",
          "Já compartilhou o interesse em aprender outros instrumentos, especialmente violão, além de sua experiência com piano.",
        ],

        sources: roraSources["pt-BR"],
      },
    },
  },

  // ====================================================
  // CHIQUITA
  // ====================================================

  {
    slug: "chiquita",
    name: "CHIQUITA",
    number: "07",
    birthday: "2009-02-17",

    nationality: {
      en: "Thai",
      "pt-BR": "Tailandesa",
    },

    gradient: "from-fuchsia-950 via-purple-900 to-black",

    bio: {
      en: {
        intro:
          "CHIQUITA is BABYMONSTER's youngest member, known for her expressive performances and bright personality. Born in Nakhon Ratchasima, Thailand, she became part of the group's story after an unusually short trainee period. Her development and confidence attracted attention from the very beginning of the project.",

        earlyInterestTitle: "A young talent from Thailand",
        earlyInterest:
          "CHIQUITA was born in Nakhon Ratchasima, Thailand. Public member profiles identify her as the younger sister of Copper, a member of the Thai boy group BUS. Alongside PHARITA and RORA, she has shared that watching YG artists perform helped inspire her dream of becoming an artist while she was still young.",

        ygJourneyTitle: "Only three months before joining the project",
        ygJourney:
          "CHIQUITA joined the BABYMONSTER project after only three months of training at YG, making her the member with the shortest initial training period. YG producer Yang Hyun Suk described her as fearless and said that her first monthly evaluation immediately caught his attention. The company also highlighted her clear high notes and the rapid development of her own vocal style.",

        offStageTitle: "Collectibles, plushies and little joys",
        offStage:
          "In a 2026 interview with Vogue Hong Kong, CHIQUITA revealed that she enjoys collecting designer toys, figures and blind-box collectibles. She explained that opening them is exciting and helps her relax. Member profiles also mention her love of plushies, bright colors and food such as ramen, offering a playful contrast to her powerful stage performances.",

        highlightsTitle: "The youngest with a fast start",
        highlights: [
          "Joined the BABYMONSTER project after only three months of YG training, the shortest initial training period among the members.",
          "YG highlighted her fearlessness during her first monthly evaluation and her clear high notes.",
          "Became the youngest member of the final seven-member lineup.",
          "Her interest in collecting designer toys and blind-box figures was shared directly in a 2026 Vogue Hong Kong interview.",
        ],

        sources: chiquitaSources.en,
      },

      "pt-BR": {
        intro:
          "CHIQUITA é a integrante mais jovem do BABYMONSTER, conhecida por suas apresentações expressivas e personalidade alegre. Nascida em Nakhon Ratchasima, na Tailândia, passou a fazer parte da história do grupo após um período de treinamento inicial bastante curto. Seu desenvolvimento e sua confiança chamaram a atenção desde o início do projeto.",

        earlyInterestTitle: "Um talento jovem da Tailândia",
        earlyInterest:
          "CHIQUITA nasceu em Nakhon Ratchasima, na Tailândia. Perfis públicos das integrantes a identificam como irmã mais nova de Copper, integrante do grupo masculino tailandês BUS. Ao lado de PHARITA e RORA, ela contou que assistir aos artistas da YG se apresentando ajudou a inspirar seu sonho de se tornar artista ainda pequena.",

        ygJourneyTitle: "Apenas três meses antes de entrar no projeto",
        ygJourney:
          "CHIQUITA entrou no projeto BABYMONSTER após apenas três meses de treinamento na YG, tornando-se a integrante com o menor período inicial de preparação. O produtor da YG, Yang Hyun Suk, descreveu sua personalidade como destemida e contou que sua primeira avaliação mensal chamou imediatamente sua atenção. A empresa também destacou seus agudos claros e o rápido desenvolvimento de seu próprio estilo vocal.",

        offStageTitle: "Colecionáveis, pelúcias e pequenas alegrias",
        offStage:
          "Em uma entrevista de 2026 à Vogue Hong Kong, CHIQUITA revelou que gosta de colecionar brinquedos de design, figuras e itens de caixas-surpresa. Ela explicou que abrir essas embalagens é emocionante e a ajuda a relaxar. Perfis das integrantes também mencionam seu carinho por pelúcias, cores vibrantes e comidas como ramen, mostrando um contraste divertido com suas apresentações poderosas nos palcos.",

        highlightsTitle: "A mais jovem com uma trajetória rápida",
        highlights: [
          "Entrou no projeto BABYMONSTER após apenas três meses de treinamento na YG, o menor período inicial de preparação entre as integrantes.",
          "A YG destacou sua personalidade destemida durante a primeira avaliação mensal e seus agudos vocais bem definidos.",
          "Tornou-se a integrante mais jovem da formação final de sete membros.",
          "Seu interesse por brinquedos de design e figuras de caixas-surpresa foi compartilhado diretamente em uma entrevista de 2026 à Vogue Hong Kong.",
        ],

        sources: chiquitaSources["pt-BR"],
      },
    },
  },
] satisfies readonly Member[];