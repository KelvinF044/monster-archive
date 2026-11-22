
type LocaleKey = "en" | "pt-BR";

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
  sources: {
    label: string;
    url: string;
  }[];
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

const officialYG =
  "https://ygfamily.com/en/artists/babymonster/profile";

const cnnInterview =
  "https://www.cnnbrasil.com.br/pop/rumo-ao-grammy-grupo-de-k-pop-babymonster-quer-conquistar-o-mundo/";

const sweetyInterview =
  "https://www.sweetyhigh.com/read/babymonster-deserve-interview";

const vogueInterview =
  "https://www.voguehk.com/en/article/fashion/babymonster-cover-interview/";

const joongAngArticle =
  "https://www.koreajoongangdaily.com/entertainment/one-gone-one-renamed-six-members-of-babymonster-gear-up-for-debut/10115947";

export const members = [
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
          "RUKA is BABYMONSTER's Japanese member and one of its most experienced performers. Her connection with dance began in childhood, and her artistic journey later expanded into singing and rap.",

        earlyInterestTitle: "A passion for dance",
        earlyInterest:
          "RUKA shared that she began learning dance during elementary school and developed a love for performing on stage from an early age. Hip-hop and dance remain important parts of her artistic identity.",

        ygJourneyTitle: "Her journey at YG",
        ygJourney:
          "YG's introduction video included footage from RUKA's audition in 2018. Korea JoongAng Daily reported that she trained with YG Entertainment for approximately five years before debut. During that period, she also developed her singing and rap skills.",

        offStageTitle: "Beyond the stage",
        offStage:
          "Despite her powerful stage presence, RUKA describes herself as playful off stage. She enjoys sharing funny memes and photos with the other members and making them laugh. She has also mentioned enjoying movies and TV dramas during her free time.",

        highlightsTitle: "Career highlights",
        highlights: [
          "Her YG audition footage dates back to 2018.",
          "Completed approximately five years of training before debut.",
          "Selected as one of the seven final members through Last Evaluation.",
          "Made her official seven-member debut with BABYMONS7ER on April 1, 2024.",
        ],

        sources: [
          {
            label: "YG Official Profile",
            url: officialYG,
          },
          {
            label: "Soompi - Introducing RUKA",
            url: "https://www.soompi.com/article/1565867wpp/watch-ygs-new-girl-group-babymonster-introduces-member-ruka-with-audition-footage-interview-with-yang-hyun-suk-and-more",
          },
          {
            label: "CNN Brasil Interview",
            url: cnnInterview,
          },
          {
            label: "Sweety High Interview",
            url: sweetyInterview,
          },
        ],
      },

      "pt-BR": {
        intro:
          "RUKA é a integrante japonesa do BABYMONSTER e uma das artistas com maior experiência em apresentações. Sua conexão com a dança começou na infância, e sua trajetória artística posteriormente se expandiu para o canto e o rap.",

        earlyInterestTitle: "Uma paixão pela dança",
        earlyInterest:
          "RUKA contou que começou a aprender dança ainda durante o ensino fundamental e desenvolveu desde cedo o amor por se apresentar nos palcos. O hip-hop e a dança continuam sendo partes importantes de sua identidade artística.",

        ygJourneyTitle: "Sua trajetória na YG",
        ygJourney:
          "O vídeo de apresentação da YG inclui imagens da audição de RUKA em 2018. O Korea JoongAng Daily informou que ela treinou na YG Entertainment por aproximadamente cinco anos antes do debut. Durante esse período, também desenvolveu suas habilidades de canto e rap.",

        offStageTitle: "Além dos palcos",
        offStage:
          "Apesar de sua presença marcante nos palcos, RUKA se descreve como brincalhona fora deles. Ela gosta de compartilhar memes e fotos engraçadas com as outras integrantes e fazê-las rir. Também já comentou que gosta de assistir a filmes e dramas em seu tempo livre.",

        highlightsTitle: "Destaques da carreira",
        highlights: [
          "Imagens de sua audição na YG, realizada em 2018, foram utilizadas em seu vídeo de apresentação.",
          "Concluiu aproximadamente cinco anos de treinamento antes do debut.",
          "Foi selecionada como uma das sete integrantes finais através do Last Evaluation.",
          "Fez sua estreia oficial com sete integrantes no álbum BABYMONS7ER, em 1º de abril de 2024.",
        ],

        sources: [
          {
            label: "Perfil oficial da YG",
            url: officialYG,
          },
          {
            label: "Soompi - Apresentação de RUKA",
            url: "https://www.soompi.com/article/1565867wpp/watch-ygs-new-girl-group-babymonster-introduces-member-ruka-with-audition-footage-interview-with-yang-hyun-suk-and-more",
          },
          {
            label: "Entrevista à CNN Brasil",
            url: cnnInterview,
          },
          {
            label: "Entrevista à Sweety High",
            url: sweetyInterview,
          },
        ],
      },
    },
  },

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
          "PHARITA is BABYMONSTER's Thai member. Her journey to YG Entertainment began with a global audition, driven by her dream of becoming an artist and her admiration for the performers who inspired her.",

        earlyInterestTitle: "Inspired by music",
        earlyInterest:
          "PHARITA shared that she and fellow members RORA and CHIQUITA loved music from a young age. Watching YG artists perform helped inspire their dream of becoming artists themselves. She has also named BLACKPINK's LISA as an important role model.",

        ygJourneyTitle: "From Thailand to YG",
        ygJourney:
          "According to SBS, PHARITA joined YG Entertainment through a global audition in 2020. The audition was reported to have 1,226 applicants for each available trainee spot. She moved from Thailand to Korea to pursue her dream of becoming a YG artist and performing on stage.",

        offStageTitle: "Beyond the stage",
        offStage:
          "PHARITA enjoys going on long walks, exploring new places and shopping with the other members. She has described these simple moments together as a fun way to discover new things and create memories.",

        highlightsTitle: "Career highlights",
        highlights: [
          "Joined YG Entertainment through a global audition in 2020.",
          "Was selected for BABYMONSTER after the Last Evaluation process.",
          "Showcased her singing and dancing abilities during the group's pre-debut evaluation content.",
          "Made her official seven-member debut with BABYMONS7ER on April 1, 2024.",
        ],

        sources: [
          {
            label: "YG Official Profile",
            url: officialYG,
          },
          {
            label: "SBS Star - PHARITA's YG Journey",
            url: "https://news.sbs.co.kr/amp/news.amp?news_id=N1007083236",
          },
          {
            label: "CNN Brasil Interview",
            url: cnnInterview,
          },
          {
            label: "Vogue Hong Kong Interview",
            url: vogueInterview,
          },
          {
            label: "Sweety High Interview",
            url: sweetyInterview,
          },
        ],
      },

      "pt-BR": {
        intro:
          "PHARITA é a integrante tailandesa do BABYMONSTER. Sua trajetória até a YG Entertainment começou através de uma audição global, motivada pelo sonho de se tornar artista e pela admiração por artistas que a inspiraram.",

        earlyInterestTitle: "Inspirada pela música",
        earlyInterest:
          "PHARITA contou que ela e as integrantes RORA e CHIQUITA amavam música desde pequenas. Assistir às apresentações de artistas da YG ajudou a inspirar o sonho de também se tornarem artistas. Ela também já apontou LISA, do BLACKPINK, como uma importante referência.",

        ygJourneyTitle: "Da Tailândia até a YG",
        ygJourney:
          "Segundo a SBS, PHARITA entrou na YG Entertainment através de uma audição global em 2020. A seleção foi divulgada como tendo 1.226 candidatos por vaga disponível para trainee. Ela saiu da Tailândia e foi para a Coreia em busca do sonho de se tornar uma artista da YG e se apresentar nos palcos.",

        offStageTitle: "Além dos palcos",
        offStage:
          "PHARITA gosta de fazer longas caminhadas, conhecer lugares novos e sair para fazer compras com as outras integrantes. Ela descreveu esses momentos simples juntas como uma maneira divertida de descobrir coisas novas e criar lembranças.",

        highlightsTitle: "Destaques da carreira",
        highlights: [
          "Entrou na YG Entertainment através de uma audição global em 2020.",
          "Foi selecionada para o BABYMONSTER após o processo do Last Evaluation.",
          "Demonstrou suas habilidades de canto e dança nos conteúdos de avaliação pré-debut do grupo.",
          "Fez sua estreia oficial com sete integrantes no álbum BABYMONS7ER, em 1º de abril de 2024.",
        ],

        sources: [
          {
            label: "Perfil oficial da YG",
            url: officialYG,
          },
          {
            label: "SBS Star - Trajetória de PHARITA",
            url: "https://news.sbs.co.kr/amp/news.amp?news_id=N1007083236",
          },
          {
            label: "Entrevista à CNN Brasil",
            url: cnnInterview,
          },
          {
            label: "Entrevista à Vogue Hong Kong",
            url: vogueInterview,
          },
          {
            label: "Entrevista à Sweety High",
            url: sweetyInterview,
          },
        ],
      },
    },
  },

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
          "ASA is the Japanese rapper and performer of BABYMONSTER. Her interest in music grew through dance, and she has described the moment she realized that becoming an artist was the path she wanted to follow.",

        earlyInterestTitle: "Discovering her path",
        earlyInterest:
          "ASA shared that she began attending a dance school during her first year of high school. Through music and dance, she discovered how much joy performing brought her and began dreaming of becoming an artist.",

        ygJourneyTitle: "Her journey at YG",
        ygJourney:
          "After deciding that becoming an artist was her path, ASA continued developing her skills through her training and pre-debut preparation at YG Entertainment. Her exact joining date has not been clearly confirmed in the official profile, so this archive focuses on the journey she has personally described.",

        offStageTitle: "Beyond the stage",
        offStage:
          "ASA enjoys cooking in her free time. She has shared that she likes trying new recipes, preparing different dishes and sharing what she makes with the other members.",

        highlightsTitle: "Career highlights",
        highlights: [
          "Developed her passion for music and performance through dance school.",
          "Became one of BABYMONSTER's Japanese members and a notable rap performer.",
          "Shared the SHEESH rap section with RUKA and AHYEON, a combination she said she would like to explore further.",
          "Made her official seven-member debut with BABYMONS7ER on April 1, 2024.",
        ],

        sources: [
          {
            label: "YG Official Profile",
            url: officialYG,
          },
          {
            label: "CNN Brasil Interview",
            url: cnnInterview,
          },
          {
            label: "Sweety High Interview",
            url: sweetyInterview,
          },
          {
            label: "Vogue Hong Kong Interview",
            url: vogueInterview,
          },
        ],
      },

      "pt-BR": {
        intro:
          "ASA é a rapper e performer japonesa do BABYMONSTER. Seu interesse pela música cresceu através da dança, e ela já contou sobre o momento em que percebeu que se tornar artista era o caminho que desejava seguir.",

        earlyInterestTitle: "Descobrindo seu caminho",
        earlyInterest:
          "ASA contou que começou a frequentar uma escola de dança durante o primeiro ano do ensino médio. Através da música e da dança, descobriu o quanto gostava de se apresentar e começou a sonhar em se tornar artista.",

        ygJourneyTitle: "Sua trajetória na YG",
        ygJourney:
          "Depois de decidir que se tornar artista era seu caminho, ASA continuou desenvolvendo suas habilidades durante o treinamento e a preparação pré-debut na YG Entertainment. A data exata de sua entrada não está claramente confirmada no perfil oficial, por isso este arquivo prioriza a trajetória que ela própria compartilhou.",

        offStageTitle: "Além dos palcos",
        offStage:
          "ASA gosta de cozinhar em seu tempo livre. Ela contou que gosta de experimentar receitas, preparar pratos diferentes e compartilhar o que faz com as outras integrantes.",

        highlightsTitle: "Destaques da carreira",
        highlights: [
          "Desenvolveu sua paixão pela música e pelas apresentações através da escola de dança.",
          "Tornou-se uma das integrantes japonesas do BABYMONSTER e uma das principais representantes do rap no grupo.",
          "Dividiu a parte de rap de SHEESH com RUKA e AHYEON, combinação que ela disse ter vontade de explorar ainda mais.",
          "Fez sua estreia oficial com sete integrantes no álbum BABYMONS7ER, em 1º de abril de 2024.",
        ],

        sources: [
          {
            label: "Perfil oficial da YG",
            url: officialYG,
          },
          {
            label: "Entrevista à CNN Brasil",
            url: cnnInterview,
          },
          {
            label: "Entrevista à Sweety High",
            url: sweetyInterview,
          },
          {
            label: "Entrevista à Vogue Hong Kong",
            url: vogueInterview,
          },
        ],
      },
    },
  },

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
          "AHYEON is a South Korean member of BABYMONSTER, known for her versatile performance style. Music and dance have been part of her life since childhood, and her return completed the group's seven-member lineup before its official first EP debut.",

        earlyInterestTitle: "Music since childhood",
        earlyInterest:
          "AHYEON shared that she has enjoyed music and dancing since she was very young. Whenever music started playing, she naturally wanted to move. She has described herself as curious and someone who enjoys trying new things.",

        ygJourneyTitle: "Her path to the seven-member lineup",
        ygJourney:
          "AHYEON took part in the group's pre-debut journey and the Last Evaluation project. On January 25, 2024, YG Entertainment officially announced her return to BABYMONSTER activities and confirmed that she would participate in recording the group's first mini-album.",

        offStageTitle: "Beyond the stage",
        offStage:
          "AHYEON describes herself as a curious person who likes exploring new interests. She has also expressed a desire to experiment with more musical styles, including Latin pop, because of its rhythm and expressive energy.",

        highlightsTitle: "Career highlights",
        highlights: [
          "Selected as one of the seven members through the Last Evaluation project.",
          "Her return to group activities was officially announced by YG on January 25, 2024.",
          "Participated in BABYMONSTER's first mini-album with the complete seven-member lineup.",
          "Made her official seven-member debut with BABYMONS7ER on April 1, 2024.",
        ],

        sources: [
          {
            label: "YG Official Profile",
            url: officialYG,
          },
          {
            label: "YG - AHYEON's Return Announcement",
            url: "https://ygfamily.com/en/news/report/5717",
          },
          {
            label: "CNN Brasil Interview",
            url: cnnInterview,
          },
          {
            label: "Sweety High Interview",
            url: sweetyInterview,
          },
          {
            label: "Vogue Hong Kong Interview",
            url: vogueInterview,
          },
        ],
      },

      "pt-BR": {
        intro:
          "AHYEON é uma integrante sul-coreana do BABYMONSTER, conhecida por seu estilo versátil de performance. A música e a dança fazem parte de sua vida desde a infância, e seu retorno completou a formação de sete integrantes antes do lançamento oficial do primeiro EP do grupo.",

        earlyInterestTitle: "Música desde a infância",
        earlyInterest:
          "AHYEON contou que gosta de música e dança desde muito pequena. Sempre que uma música começava a tocar, ela naturalmente sentia vontade de se movimentar. Ela se descreve como uma pessoa curiosa e que gosta de experimentar coisas novas.",

        ygJourneyTitle: "Seu caminho até a formação de sete integrantes",
        ygJourney:
          "AHYEON participou da trajetória pré-debut do grupo e do projeto Last Evaluation. Em 25 de janeiro de 2024, a YG Entertainment anunciou oficialmente seu retorno às atividades do BABYMONSTER e confirmou sua participação nas gravações do primeiro miniálbum do grupo.",

        offStageTitle: "Além dos palcos",
        offStage:
          "AHYEON se descreve como uma pessoa curiosa, que gosta de explorar novos interesses. Ela também já demonstrou vontade de experimentar outros estilos musicais, incluindo o pop latino, por conta de seu ritmo e de sua energia expressiva.",

        highlightsTitle: "Destaques da carreira",
        highlights: [
          "Selecionada como uma das sete integrantes através do projeto Last Evaluation.",
          "Seu retorno às atividades do grupo foi anunciado oficialmente pela YG em 25 de janeiro de 2024.",
          "Participou do primeiro miniálbum do BABYMONSTER com a formação completa de sete integrantes.",
          "Fez sua estreia oficial com sete integrantes no álbum BABYMONS7ER, em 1º de abril de 2024.",
        ],

        sources: [
          {
            label: "Perfil oficial da YG",
            url: officialYG,
          },
          {
            label: "YG - Comunicado sobre o retorno de AHYEON",
            url: "https://ygfamily.com/en/news/report/5717",
          },
          {
            label: "Entrevista à CNN Brasil",
            url: cnnInterview,
          },
          {
            label: "Entrevista à Sweety High",
            url: sweetyInterview,
          },
          {
            label: "Entrevista à Vogue Hong Kong",
            url: vogueInterview,
          },
        ],
      },
    },
  },

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
          "RAMI is a South Korean member of BABYMONSTER. Formerly introduced as HARAM, she developed her dream of becoming an artist during her time at YG, where she discovered singing and dancing.",

        earlyInterestTitle: "Discovering her voice",
        earlyInterest:
          "RAMI explained that she began learning to sing and dance after joining YG Entertainment. As she continued developing those skills, she became increasingly certain that she wanted to become an artist.",

        ygJourneyTitle: "From HARAM to RAMI",
        ygJourney:
          "Before debut, she was introduced to the public as HARAM. In 2023, YG explained through Korea JoongAng Daily that the name RAMI came from a nickname used by the other members. The company also associated the name with meanings such as love, happiness and the first light of a lamp.",

        offStageTitle: "Beyond the stage",
        offStage:
          "RAMI has shared her appreciation for music by naming Charlie Puth as her favorite artist. She also described BATTER UP as especially meaningful because it was the first song released by BABYMONSTER.",

        highlightsTitle: "Career highlights",
        highlights: [
          "Introduced to fans under the name HARAM before adopting the stage name RAMI.",
          "Discovered her desire to become an artist while learning singing and dancing at YG.",
          "Selected as one of the seven final members through Last Evaluation.",
          "Made her official seven-member debut with BABYMONS7ER on April 1, 2024.",
        ],

        sources: [
          {
            label: "YG Official Profile",
            url: officialYG,
          },
          {
            label: "Korea JoongAng Daily - RAMI's Stage Name",
            url: joongAngArticle,
          },
          {
            label: "CNN Brasil Interview",
            url: cnnInterview,
          },
          {
            label: "Vogue Hong Kong Interview",
            url: vogueInterview,
          },
        ],
      },

      "pt-BR": {
        intro:
          "RAMI é uma integrante sul-coreana do BABYMONSTER. Anteriormente apresentada como HARAM, ela desenvolveu o sonho de se tornar artista durante seu período na YG, onde descobriu a dança e o canto.",

        earlyInterestTitle: "Descobrindo sua voz",
        earlyInterest:
          "RAMI explicou que começou a aprender a cantar e dançar depois de entrar na YG Entertainment. Conforme continuava desenvolvendo essas habilidades, passou a ter cada vez mais certeza de que queria se tornar artista.",

        ygJourneyTitle: "De HARAM a RAMI",
        ygJourney:
          "Antes do debut, ela foi apresentada ao público como HARAM. Em 2023, a YG explicou ao Korea JoongAng Daily que o nome RAMI surgiu de um apelido utilizado pelas outras integrantes. A empresa também associou o nome a significados como amor, felicidade e a primeira luz de uma lâmpada.",

        offStageTitle: "Além dos palcos",
        offStage:
          "RAMI já demonstrou sua admiração pela música ao revelar que Charlie Puth é seu artista favorito. Ela também contou que BATTER UP tem um significado especial, por ter sido a primeira música lançada pelo BABYMONSTER.",

        highlightsTitle: "Destaques da carreira",
        highlights: [
          "Foi apresentada aos fãs com o nome HARAM antes de adotar o nome artístico RAMI.",
          "Descobriu o desejo de se tornar artista enquanto aprendia canto e dança na YG.",
          "Foi selecionada como uma das sete integrantes finais através do Last Evaluation.",
          "Fez sua estreia oficial com sete integrantes no álbum BABYMONS7ER, em 1º de abril de 2024.",
        ],

        sources: [
          {
            label: "Perfil oficial da YG",
            url: officialYG,
          },
          {
            label: "Korea JoongAng Daily - Nome artístico de RAMI",
            url: joongAngArticle,
          },
          {
            label: "Entrevista à CNN Brasil",
            url: cnnInterview,
          },
          {
            label: "Entrevista à Vogue Hong Kong",
            url: vogueInterview,
          },
        ],
      },
    },
  },

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
          "RORA is a South Korean member of BABYMONSTER, recognized for her expressive and soulful vocals. Her love for music began early, inspired in part by watching artists from YG Entertainment.",

        earlyInterestTitle: "Inspired by YG artists",
        earlyInterest:
          "RORA shared that she, PHARITA and CHIQUITA loved music from a young age. Watching YG artists sing and dance helped inspire their shared dream of becoming performers.",

        ygJourneyTitle: "Her journey at YG",
        ygJourney:
          "RORA continued developing her musical abilities through her preparation at YG Entertainment and became one of the seven members selected through Last Evaluation. Korea JoongAng Daily highlighted her strong, soulful vocals and detailed musical expression when reporting on the group's pre-debut lineup.",

        offStageTitle: "Beyond the stage",
        offStage:
          "Away from performances, RORA describes herself as laid-back. She enjoys drawing, watching movies and TV shows, and relaxing with the other members after their schedules.",

        highlightsTitle: "Career highlights",
        highlights: [
          "Recognized for her strong and soulful vocal qualities during the group's pre-debut period.",
          "Selected as one of the seven members through Last Evaluation.",
          "Shared that watching YG artists helped inspire her dream of becoming an artist.",
          "Made her official seven-member debut with BABYMONS7ER on April 1, 2024.",
        ],

        sources: [
          {
            label: "YG Official Profile",
            url: officialYG,
          },
          {
            label: "Korea JoongAng Daily - BABYMONSTER Lineup",
            url: joongAngArticle,
          },
          {
            label: "CNN Brasil Interview",
            url: cnnInterview,
          },
          {
            label: "Sweety High Interview",
            url: sweetyInterview,
          },
          {
            label: "Vogue Hong Kong Interview",
            url: vogueInterview,
          },
        ],
      },

      "pt-BR": {
        intro:
          "RORA é uma integrante sul-coreana do BABYMONSTER, reconhecida por seus vocais expressivos e marcantes. Seu amor pela música começou cedo, inspirado em parte por assistir aos artistas da YG Entertainment.",

        earlyInterestTitle: "Inspirada pelos artistas da YG",
        earlyInterest:
          "RORA contou que ela, PHARITA e CHIQUITA amavam música desde pequenas. Assistir aos artistas da YG cantando e dançando ajudou a inspirar o sonho compartilhado de se tornarem performers.",

        ygJourneyTitle: "Sua trajetória na YG",
        ygJourney:
          "RORA continuou desenvolvendo suas habilidades musicais durante sua preparação na YG Entertainment e se tornou uma das sete integrantes selecionadas através do Last Evaluation. O Korea JoongAng Daily destacou seus vocais fortes e marcantes e sua expressão musical detalhada ao noticiar a formação pré-debut do grupo.",

        offStageTitle: "Além dos palcos",
        offStage:
          "Fora das apresentações, RORA se descreve como uma pessoa tranquila. Ela gosta de desenhar, assistir a filmes e programas de TV e descansar com as outras integrantes depois dos compromissos.",

        highlightsTitle: "Destaques da carreira",
        highlights: [
          "Reconhecida por seus vocais fortes e marcantes durante o período pré-debut do grupo.",
          "Selecionada como uma das sete integrantes através do Last Evaluation.",
          "Compartilhou que assistir aos artistas da YG ajudou a inspirar seu sonho de se tornar artista.",
          "Fez sua estreia oficial com sete integrantes no álbum BABYMONS7ER, em 1º de abril de 2024.",
        ],

        sources: [
          {
            label: "Perfil oficial da YG",
            url: officialYG,
          },
          {
            label: "Korea JoongAng Daily - Formação do BABYMONSTER",
            url: joongAngArticle,
          },
          {
            label: "Entrevista à CNN Brasil",
            url: cnnInterview,
          },
          {
            label: "Entrevista à Sweety High",
            url: sweetyInterview,
          },
          {
            label: "Entrevista à Vogue Hong Kong",
            url: vogueInterview,
          },
        ],
      },
    },
  },

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
          "CHIQUITA is the Thai youngest member of BABYMONSTER. Her love for music began at a young age, and she has shared how watching YG artists helped inspire her dream of becoming a performer.",

        earlyInterestTitle: "A dream inspired by music",
        earlyInterest:
          "CHIQUITA shared that she, PHARITA and RORA loved music from a young age and dreamed of becoming artists while watching YG performers. She has also described how exciting it felt to perform in front of an audience and later see fans cheering for the group.",

        ygJourneyTitle: "Becoming a BABYMONSTER member",
        ygJourney:
          "CHIQUITA was the first member publicly introduced for the BABYMONSTER project. She later took part in Last Evaluation and was selected for the final seven-member lineup. Her path from Thailand to the YG project became part of the group's pre-debut story.",

        offStageTitle: "Beyond the stage",
        offStage:
          "CHIQUITA describes herself as someone who loves having fun and making people laugh. She enjoys joking around with the other members. She has also shared that she likes drawing and ordering delicious food with the members during their free time.",

        highlightsTitle: "Career highlights",
        highlights: [
          "Was the first member publicly introduced for the BABYMONSTER project.",
          "Became the youngest member of the final seven-member lineup.",
          "Selected through Last Evaluation alongside the other six members.",
          "Made her official seven-member debut with BABYMONS7ER on April 1, 2024.",
        ],

        sources: [
          {
            label: "YG Official Profile",
            url: officialYG,
          },
          {
            label: "Korea JoongAng Daily - BABYMONSTER Lineup",
            url: joongAngArticle,
          },
          {
            label: "CNN Brasil Interview",
            url: cnnInterview,
          },
          {
            label: "Sweety High Interview",
            url: sweetyInterview,
          },
          {
            label: "Vogue Hong Kong Interview",
            url: vogueInterview,
          },
        ],
      },

      "pt-BR": {
        intro:
          "CHIQUITA é a integrante mais jovem e tailandesa do BABYMONSTER. Seu amor pela música começou ainda cedo, e ela já contou como assistir aos artistas da YG ajudou a inspirar seu sonho de se tornar performer.",

        earlyInterestTitle: "Um sonho inspirado pela música",
        earlyInterest:
          "CHIQUITA contou que ela, PHARITA e RORA amavam música desde pequenas e sonhavam em se tornar artistas enquanto assistiam às apresentações de artistas da YG. Ela também já comentou sobre como foi emocionante se apresentar para o público e depois ver os fãs torcendo pelo grupo.",

        ygJourneyTitle: "Tornando-se integrante do BABYMONSTER",
        ygJourney:
          "CHIQUITA foi a primeira integrante apresentada publicamente no projeto BABYMONSTER. Posteriormente, participou do Last Evaluation e foi selecionada para a formação final de sete integrantes. Sua trajetória da Tailândia até o projeto da YG tornou-se parte da história pré-debut do grupo.",

        offStageTitle: "Além dos palcos",
        offStage:
          "CHIQUITA se descreve como alguém que gosta de se divertir e fazer as pessoas rirem. Ela adora brincar com as outras integrantes. Também já compartilhou que gosta de desenhar e pedir comidas gostosas com as meninas durante o tempo livre.",

        highlightsTitle: "Destaques da carreira",
        highlights: [
          "Foi a primeira integrante apresentada publicamente no projeto BABYMONSTER.",
          "Tornou-se a integrante mais jovem da formação final de sete integrantes.",
          "Foi selecionada através do Last Evaluation junto das outras seis integrantes.",
          "Fez sua estreia oficial com sete integrantes no álbum BABYMONS7ER, em 1º de abril de 2024.",
        ],

        sources: [
          {
            label: "Perfil oficial da YG",
            url: officialYG,
          },
          {
            label: "Korea JoongAng Daily - Formação do BABYMONSTER",
            url: joongAngArticle,
          },
          {
            label: "Entrevista à CNN Brasil",
            url: cnnInterview,
          },
          {
            label: "Entrevista à Sweety High",
            url: sweetyInterview,
          },
          {
            label: "Entrevista à Vogue Hong Kong",
            url: vogueInterview,
          },
        ],
      },
    },
  },
] satisfies readonly Member[];
