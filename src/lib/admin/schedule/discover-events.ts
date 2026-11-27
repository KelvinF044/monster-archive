import "server-only";

import { readPublicBytes } from "../editorial/read-feed";
import type { AdminDatabase } from "../news/queries";
import { EVENT_SOURCE_URLS, type EventDiscoveryResult, type EventProvider } from "./discovery";
import { type EventFields } from "./model";
import { parseChoomSchedule, parseCoachellaAnnouncement } from "./parse-discovered-events";
import { calendarDay, parseYgSchedule, ygScheduleMonths } from "./yg-schedule";

async function readSource(provider: EventProvider, now: Date) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  if (provider !== "yg-schedule") {
    const html = decoder.decode(await readPublicBytes(EVENT_SOURCE_URLS[provider], "text/html"));
    const events = provider === "choom" ? parseChoomSchedule(html) : parseCoachellaAnnouncement(html);
    if (!events.length) throw new Error("Unrecognized source");
    return { events, incomplete: false };
  }

  const months = await Promise.allSettled(ygScheduleMonths(now).map(async ({ period, url }) => {
    const bytes = await readPublicBytes(url, "application/json");
    return parseYgSchedule(JSON.parse(decoder.decode(bytes)), period);
  }));
  const served = months.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
  if (!served.length) throw new Error("Calendar unavailable");
  return { events: served.flat(), incomplete: served.length < months.length };
}

export async function discoverEvents(db: AdminDatabase, provider: EventProvider, now = new Date()): Promise<EventDiscoveryResult | null> {
  let discovered;
  try {
    discovered = await readSource(provider, now);
  } catch {
    return null;
  }

  const { events, incomplete } = discovered;
  const upcoming = events.filter(event => event.starts_on >= calendarDay(now, event.timezone || "UTC"))
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on) || a.start_time.localeCompare(b.start_time) || a.slug.localeCompare(b.slug));

  if (!upcoming.length) return { suggestions: [], incomplete };

  const [matchingSlugs, matchingSource] = await Promise.all([
    db.from("agenda_events").select("id,slug").in("slug", upcoming.map(event => event.slug)),
    provider === "yg-schedule" ? null
      : db.from("agenda_events").select("id,starts_on,location").eq("official_event_url", EVENT_SOURCE_URLS[provider])
        .in("starts_on", [...new Set(upcoming.map(event => event.starts_on))])
        .order("id"),
  ]);
  if (matchingSlugs.error || matchingSource?.error) throw new Error("database_error");

  function existingId(fields: EventFields) {
    return matchingSlugs.data?.find(event => event.slug === fields.slug)?.id
      ?? matchingSource?.data?.find(event => event.starts_on === fields.starts_on
        && event.location?.trim().toLowerCase() === fields.location.toLowerCase())?.id
      ?? null;
  }
  return { suggestions: upcoming.map(fields => ({ fields, existingId: existingId(fields) })), incomplete };
}
