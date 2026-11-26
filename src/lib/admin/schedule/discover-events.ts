import "server-only";

import { readPublicBytes } from "../editorial/read-feed";
import type { AdminDatabase } from "../news/queries";
import { EVENT_SOURCE_URLS, type EventProvider, type EventSuggestion } from "./discovery";
import { parseChoomSchedule, parseCoachellaAnnouncement } from "./parse-discovered-events";

export async function discoverEvents(db: AdminDatabase, provider: EventProvider, now = new Date()): Promise<EventSuggestion[] | null> {
  const source = EVENT_SOURCE_URLS[provider];
  let events;
  try {
    const html = new TextDecoder("utf-8", { fatal: true }).decode(await readPublicBytes(source, "text/html"));
    events = provider === "choom" ? parseChoomSchedule(html) : parseCoachellaAnnouncement(html);
  } catch {
    return null;
  }
  if (!events.length) return null;

  const upcoming = events.filter(event => {
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: event.timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return event.starts_on >= today;
  }).sort((a, b) => a.starts_on.localeCompare(b.starts_on) || a.start_time.localeCompare(b.start_time) || a.slug.localeCompare(b.slug));
  if (!upcoming.length) return [];

  const [matchingSlugs, matchingSource] = await Promise.all([
    db.from("agenda_events").select("id,slug").in("slug", upcoming.map(event => event.slug)),
    db.from("agenda_events").select("id,starts_on,location").eq("official_event_url", source)
      .in("starts_on", [...new Set(upcoming.map(event => event.starts_on))])
      .order("id"),
  ]);
  if (matchingSlugs.error || matchingSource.error) throw new Error("database_error");
  return upcoming.map(fields => ({
    fields,
    existingId: matchingSlugs.data.find(event => event.slug === fields.slug)?.id
      ?? matchingSource.data.find(event => event.starts_on === fields.starts_on
        && event.location?.trim().toLowerCase() === fields.location.toLowerCase())?.id
      ?? null,
  }));
}
