import { readObject, textValue } from "../news/model.ts";
import { type EventCategory, type EventFields, parseEvent, validDate } from "./model.ts";
import { EVENT_SOURCE_URLS } from "./discovery.ts";
import { choomEvent, eventTime } from "./parse-discovered-events.ts";

const YG_ARTIST_ID = 319;
const SEOUL = "Asia/Seoul";

const programs = [
  { pattern: /인기가요|inkigayo/i, name: "SBS Inkigayo" },
  { pattern: /뮤직뱅크|music bank/i, name: "KBS Music Bank" },
  { pattern: /엠카운트다운|m\s*countdown/i, name: "Mnet M Countdown" },
  { pattern: /음악중심|music core/i, name: "MBC Show! Music Core" },
  { pattern: /쇼\s*챔피언|show champion/i, name: "MBC M Show Champion" },
  { pattern: /더\s*쇼|sbs\s*(?:m\s*)?the show/i, name: "SBS M The Show" },
  { pattern: /정오의 희망곡/, name: "MBC FM4U Hope Song at Noon" },
  { pattern: /웬디의 영스트리트/, name: "SBS PowerFM Wendy’s Youngstreet" },
  { pattern: /두시탈출 컬투쇼/, name: "SBS PowerFM Cultwo Show" },
];

export function calendarDay(at: Date, timeZone: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(at);
}

export function ygScheduleMonths(now: Date) {
  const [year, month] = calendarDay(now, SEOUL).slice(0, 7).split("-").map(Number);
  return Array.from({ length: 3 }, (_, offset) => {
    const day = new Date(Date.UTC(year, month - 1 + offset, 1));
    const period = day.toISOString().slice(0, 7);
    const url = new URL(`/api/artist/schedule/list/${YG_ARTIST_ID}/${day.getUTCFullYear()}/${day.getUTCMonth() + 1}`, EVENT_SOURCE_URLS["yg-schedule"]);
    return { period, url: url.href };
  });
}

export function parseYgSchedule(payload: unknown, period: string): EventFields[] {
  if (!Array.isArray(payload)) throw new Error("Invalid YG schedule response");
  const events = new Map<string, EventFields>();
  let recognized = false;
  for (const value of payload) {
    const item = readObject(value);
    if (!item || item.artistId !== YG_ARTIST_ID || typeof item.isDisplay !== "boolean") continue;
    const id = item.id;
    const title = textValue(item.title, 160, true);
    const venue = textValue(item.place ?? "", 250) ?? "";
    const date = typeof item.date === "string" ? item.date : "";
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1
      || !title || !validDate(date) || !date.startsWith(period + "-")) continue;
    recognized = true;
    if (!item.isDisplay) continue;
    if (/취소|연기|\bcancell?ed\b|\bpostponed\b/i.test(title)) continue;
    const clock = typeof item.time === "string" ? item.time.trim() : "";
    const fields = ygEvent(id, title, venue, date, clock, item.type);
    if (parseEvent(fields).ok) events.set(fields.slug, fields);
  }
  if (payload.length && !recognized) throw new Error("Unrecognized YG schedule entries");
  return [...events.values()];
}

function ygEvent(id: number, title: string, venue: string, date: string, clock: string, kind: unknown): EventFields {
  const tour = /\bBABYMONSTER WORLD TOUR\s*\[[^\]]*\bCHOOM\b[^\]]*\]\s+IN\s+(.+)$/i.exec(title);
  const source = EVENT_SOURCE_URLS["yg-schedule"];
  if (tour && venue) return choomEvent(tour[1].trim(), venue, date, clock, source);

  const program = programs.find(program => program.pattern.test(title));
  const name = program?.name ?? title;
  const koreaBroadcast = (kind === "tv" || kind === "radio")
    && /^(?:SBS|KBS|MBC|Mnet)\b/i.test(title);
  let category: EventCategory = "other";
  if (/\bCoachella\b/i.test(title)) category = "festival";
  else if (/\bawards\b|시상식/i.test(title)) category = "awards";
  else if (kind === "tv") category = program ? "music_show" : "broadcast";
  else if (kind === "radio") category = "broadcast";
  else if (kind === "concert") category = "concert";
  const coachella = category === "festival";
  const location = coachella ? "Indio, California" : "";
  const timezone = coachella ? "America/Los_Angeles" : koreaBroadcast ? SEOUL : "";

  return {
    ...eventTime(date, clock, timezone),
    slug: coachella ? `babymonster-coachella-${date}` : `babymonster-yg-${id}`,
    title_pt: `BABYMONSTER — ${name}`,
    title_en: `BABYMONSTER — ${name}`,
    summary_pt: `Participação do BABYMONSTER em ${name}, conforme a agenda oficial da YG Entertainment.`,
    summary_en: `BABYMONSTER is scheduled to appear on ${name}, according to YG Entertainment’s official calendar.`,
    official_event_url: source,
    category,
    location,
    venue_name: venue,
  };
}
