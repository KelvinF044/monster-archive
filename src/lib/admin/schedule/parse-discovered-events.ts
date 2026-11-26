import { load } from "cheerio/slim";
import { slugify } from "../news/model.ts";
import { blankEvent, localTimeCandidates, parseEvent, validDate, type EventFields } from "./model.ts";
import { EVENT_SOURCE_URLS } from "./discovery.ts";

const tourTimeZones: Record<string, string> = {
  SEOUL: "Asia/Seoul",
  KOBE: "Asia/Tokyo",
  FUKUOKA: "Asia/Tokyo",
  YOKOHAMA: "Asia/Tokyo",
  CHIBA: "Asia/Tokyo",
  NAGOYA: "Asia/Tokyo",
  OSAKA: "Asia/Tokyo",
  MANILA: "Asia/Manila",
  MACAO: "Asia/Macau",
  JAKARTA: "Asia/Jakarta",
  BANGKOK: "Asia/Bangkok",
  "KUALA LUMPUR": "Asia/Kuala_Lumpur",
  TAIPEI: "Asia/Taipei",
  SINGAPORE: "Asia/Singapore",
  AUCKLAND: "Pacific/Auckland",
  MELBOURNE: "Australia/Melbourne",
  SYDNEY: "Australia/Sydney",
  "HONG KONG": "Asia/Hong_Kong",
};

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

export function parseChoomSchedule(html: string): EventFields[] {
  const $ = load(html);
  const events: EventFields[] = [];
  for (const row of $(".row").toArray()) {
    const city = clean($(row).find(".left .item1").first().text());
    const venue = clean($(row).find(".left .item2").first().text());
    if (!city || !venue) continue;

    const timezone = tourTimeZones[city.toUpperCase()] ?? "";
    for (const date of $(row).find(".right .item4 p").toArray()) {
      const raw = clean($(date).text());
      const match = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})\.\s*\([a-z]{3}\)(?:\s+(\d{1,2})(?::([0-5]\d))?\s*(AM|PM))?$/i);
      if (!match) continue;

      const [, year, month, day, hours, minutes, period] = match;
      const startsOn = `${year}-${month}-${day}`;
      if (!validDate(startsOn) || (hours && (Number(hours) < 1 || Number(hours) > 12))) continue;
      const hour = hours ? (Number(hours) % 12) + (period.toUpperCase() === "PM" ? 12 : 0) : null;
      const clock = hour === null ? "" : `${String(hour).padStart(2, "0")}:${minutes ?? "00"}`;
      const startTime = clock && timezone && localTimeCandidates(startsOn, clock, timezone).length === 1 ? clock : "";
      events.push({
        ...blankEvent(),
        slug: `babymonster-choom-${slugify(city)}-${startsOn}`,
        title_pt: `BABYMONSTER WORLD TOUR [CHOOM] em ${city}`,
        title_en: `BABYMONSTER WORLD TOUR [CHOOM] in ${city}`,
        summary_pt: `O BABYMONSTER apresenta a turnê CHOOM em ${venue}, ${city}.`,
        summary_en: `BABYMONSTER brings the CHOOM world tour to ${venue} in ${city}.`,
        category: "concert",
        location: city,
        venue_name: venue,
        official_event_url: EVENT_SOURCE_URLS.choom,
        starts_on: startsOn,
        start_time: startTime,
        timezone,
        time_kind: startTime ? "timed" : "time_tba",
      });
    }
  }
  return validatedEvents(events);
}

export function parseCoachellaAnnouncement(html: string): EventFields[] {
  const $ = load(html);
  const title = clean($(".view_header .view_tit h2").first().text());
  const body = clean($(".view_body .ql-editor").first().text());
  if (!/BABYMONSTER/i.test(title) || !/Coachella/i.test(title)) return [];

  const year = body.match(/\b(20\d{2}) Coachella Valley Music and Arts Festival\b/i)?.[1];
  const shows = body.match(/\bBABYMONSTER will take the stage twice, on April (\d{1,2}) and (\d{1,2})\b/i);
  if (!year || !shows || shows[1] === shows[2]) return [];

  return validatedEvents(shows.slice(1).map(day => {
    const date = `${year}-04-${day.padStart(2, "0")}`;
    return {
      ...blankEvent(),
      slug: `babymonster-coachella-${date}`,
      title_pt: "BABYMONSTER no Coachella",
      title_en: "BABYMONSTER at Coachella",
      summary_pt: "O BABYMONSTER se apresenta no Coachella Valley Music and Arts Festival, em Indio, na Califórnia.",
      summary_en: "BABYMONSTER performs at the Coachella Valley Music and Arts Festival in Indio, California.",
      category: "festival",
      location: "Indio, California",
      official_event_url: EVENT_SOURCE_URLS.coachella,
      starts_on: date,
      timezone: "America/Los_Angeles",
    };
  }));
}

function validatedEvents(events: EventFields[]) {
  const slugs = new Set<string>();
  for (const event of events) {
    if (!parseEvent(event).ok || slugs.has(event.slug)) throw new Error("Invalid or duplicate event in the official source");
    slugs.add(event.slug);
  }
  return events;
}
