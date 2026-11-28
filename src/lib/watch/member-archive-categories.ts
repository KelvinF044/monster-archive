import type { Dictionary } from "@/lib/i18n/messages";

export const memberArchiveCategories = {
  performances: {
    title: "performancesTitle",
    description: "performancesDescription",
    collections: ["music-show-stages", "pre-debut", "live-events", "awards"],
    gradient: "from-red-950 via-rose-900 to-black",
  },
  variety: {
    title: "varietyTitle",
    description: "varietyDescription",
    collections: ["variety-interviews"],
    gradient: "from-blue-950 via-indigo-900 to-black",
  },
  behind: {
    title: "behindTitle",
    description: "behindDescription",
    collections: ["behind-the-scenes"],
    gradient: "from-emerald-950 via-teal-900 to-black",
  },
} as const;

export type MemberArchiveCategory = keyof typeof memberArchiveCategories;

export function isMemberArchiveCategory(value: string): value is MemberArchiveCategory {
  return Object.hasOwn(memberArchiveCategories, value);
}

export const memberArchiveCategoryKeys = Object.keys(memberArchiveCategories) as MemberArchiveCategory[];

export function getMemberArchiveCategory(category: MemberArchiveCategory, copy: Dictionary["memberProfile"]) {
  const config = memberArchiveCategories[category];

  return {
    title: copy[config.title],
    description: copy[config.description],
    gradient: config.gradient,
  };
}
