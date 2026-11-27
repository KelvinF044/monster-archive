import type { EventFields } from "./model.ts";

export const EVENT_PROVIDERS = ["yg-schedule", "choom", "coachella"] as const;
export type EventProvider = typeof EVENT_PROVIDERS[number];
export type EventSuggestion = { fields: EventFields; existingId: string | null };
export type EventDiscoveryResult = { suggestions: EventSuggestion[]; incomplete?: boolean };

export const EVENT_SOURCE_URLS = {
  "yg-schedule": "https://ygfamily.com/ko/artists/babymonster/schedule",
  choom: "https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html",
  coachella: "https://ygfamily.com/en/news/report/7601",
} as const;

export function isEventProvider(value: unknown): value is EventProvider {
  return EVENT_PROVIDERS.some(provider => provider === value);
}
