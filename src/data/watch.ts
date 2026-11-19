
export const watchCategories = [
  "All",
  "Pre-debut",
  "Stages",
  "Variety",
  "Behind",
  "Events",
  "Awards",
] as const;

export const watchCollections = [
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
    title: "Music Show Stages",
    label: "LIVE PERFORMANCES",
    category: "Stages",
    description:
      "A dedicated collection for music show performances and special stages.",
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
