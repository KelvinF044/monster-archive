
export const watchCategories = [
  "All",
  "MV",
  "Pre-debut",
  "Stages",
  "Variety",
  "Behind",
  "Events",
  "Awards",
] as const;

export const watchCollections = [
  {
    slug: "music-videos",
    number: "07",
    title: "Official Music Videos",
    label: "OFFICIAL M/V",
    category: "MV",
    description:
      "Official BABYMONSTER music videos and official music video versions.",
    gradient: "from-purple-950 via-fuchsia-900 to-black",
  },
  {
    slug: "pre-debut",
    number: "01",
    title: "Before the Debut",
    label: "THE BEGINNING",
    category: "Pre-debut",
    description:
      "Discover the journey, evaluations and moments before the official debut.",
    gradient: "from-violet-950 via-purple-900 to-black",
  },
  {
    slug: "music-show-stages",
    number: "02",
    title: "Stages & Performance Videos",
    label: "LIVE PERFORMANCES",
    category: "Stages",
    description:
      "Music shows, official performance videos and special stages.",
    gradient: "from-red-950 via-rose-900 to-black",
  },
  {
    slug: "variety-interviews",
    number: "03",
    title: "Variety & Interviews",
    label: "OFF STAGE",
    category: "Variety",
    description:
      "Explore variety programs, interviews, games and television appearances.",
    gradient: "from-blue-950 via-indigo-900 to-black",
  },
  {
    slug: "behind-the-scenes",
    number: "04",
    title: "Behind the Scenes",
    label: "BEHIND THE CAMERAS",
    category: "Behind",
    description:
      "A collection dedicated to backstage moments and special documentaries.",
    gradient: "from-emerald-950 via-teal-900 to-black",
  },
  {
    slug: "live-events",
    number: "05",
    title: "Live & Festival Events",
    label: "ON THE STAGE",
    category: "Events",
    description:
      "Concerts, festivals, special appearances and live event performances.",
    gradient: "from-amber-950 via-orange-900 to-black",
  },
  {
    slug: "awards",
    number: "06",
    title: "Awards & Special Stages",
    label: "SPECIAL MOMENTS",
    category: "Awards",
    description:
      "Award ceremonies, nominations, wins and special performances.",
    gradient: "from-fuchsia-950 via-purple-900 to-black",
  },
] as const;

export const watchVideos = [
  {
    slug: "last-evaluation-ep-1",
    collectionSlug: "pre-debut",
    title: "BABYMONSTER - 'Last Evaluation' EP.1",
    description:
      "The first episode of the official Last Evaluation pre-debut series.",
    publishedAt: "March 9, 2023",
    youtubeId: "hCgZqFscMp0",
    sourceName: "BABYMONSTER Official YouTube",
    sourceUrl: "https://www.youtube.com/watch?v=hCgZqFscMp0",
    gradient: "from-violet-950 via-purple-900 to-black",
  },
  {
    slug: "sheesh-performance-video",
    collectionSlug: "music-show-stages",
    title: "BABYMONSTER - 'SHEESH' PERFORMANCE VIDEO",
    description:
      "The official SHEESH performance video from the BABYMONSTER channel.",
    publishedAt: "April 4, 2024",
    youtubeId: "kOanBE5Wg24",
    sourceName: "BABYMONSTER Official YouTube",
    sourceUrl: "https://www.youtube.com/watch?v=kOanBE5Wg24",
    gradient: "from-red-950 via-rose-900 to-black",
  },
  {
    slug: "really-like-you-music-show-behind",
    collectionSlug: "behind-the-scenes",
    title: "BABYMONSTER - 'Really Like You' MUSIC SHOW BEHIND",
    description:
      "Behind-the-scenes footage related to the Really Like You music-show promotions.",
    publishedAt: "February 17, 2026",
    youtubeId: "CAdRNXmkuc4",
    sourceName: "BABYMONSTER Official YouTube",
    sourceUrl: "https://www.youtube.com/watch?v=CAdRNXmkuc4",
    gradient: "from-emerald-950 via-teal-900 to-black",
  },
] as const;
