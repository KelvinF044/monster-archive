import { isUuid, isNewsCategory, searchText, publicUrl } from "../admin/news/model.ts";
import { isEventCategory, isEventStatus, validMonth, validDate, validTimezone, monthBounds } from "../admin/schedule/model.ts";
import type { Locale } from "../i18n/config.ts";

export const PUBLIC_PAGE_SIZE = 12;
export const CALENDAR_LIMIT = 200;
export type SearchParams = Record<string, string | string[] | undefined>;
export type View = "upcoming" | "calendar" | "history";
export type Filters = { q: string; category: string; era: string; member: string; status: string; view: View; month: string; page: number };
export function parseFilters(params: SearchParams, section: "news" | "schedule", now: Date): Filters {
  const get = (k: string) => typeof params[k] === "string" ? params[k] : "";
  const category = get("category"), era = get("era"), member = get("member"), status = get("status"), month = get("month"), view = get("view"), page = get("page");
  return {
    q: searchText(get("q")),
    category: (section === "news" ? isNewsCategory(category) : isEventCategory(category)) ? category : "",
    era: isUuid(era) ? era : "", member: isUuid(member) ? member : "",
    status: section === "schedule" && isEventStatus(status) ? status : "",
    view: section === "schedule" && (view === "history" || view === "calendar") ? view : "upcoming",
    month: section === "schedule" && validMonth(month) && month >= "1900-01" && month <= "9998-12" ? month : now.toISOString().slice(0, 7),
    page: /^\d{1,5}$/.test(page) ? Math.max(1, Number(page)) : 1,
  };
}
export function hasFilters(f: Filters) { return Boolean(f.q || f.category || f.era || f.member || f.status); }
export function editorialHref(section: "news" | "schedule", f: Filters, change: Partial<Filters> = {}) {
  const merged = { ...f, ...change };
  const p = new URLSearchParams();
  for (const key of ["q", "category", "era", "member", "status"] as const) if (merged[key]) p.set(key, merged[key]);
  if (section === "schedule") {
    if (merged.view !== "upcoming") p.set("view", merged.view);
    if (merged.view === "calendar") p.set("month", merged.month);
  }
  if (merged.page > 1 && merged.view !== "calendar") p.set("page", String(merged.page));
  const query = p.toString();
  return "/" + section + (query ? "?" + query : "");
}
export const validSlug = (s: string) => s.length <= 120 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
export function localText(pt: string | null, en: string | null, locale: Locale) { return (locale === "pt-BR" ? pt || en : en || pt) || ""; }
export function coverUrl(value: unknown) {
  const safe = publicUrl(value);
  return safe && safe.startsWith("https://") ? safe : null;
}
export function displayDate(day: string | null, locale: Locale) {
  if (!day || !validDate(day.slice(0, 10))) return "";
  return new Intl.DateTimeFormat(locale === "pt-BR" ? "pt-BR" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(day.slice(0, 10) + "T00:00:00Z"));
}
export function eventClock(instant: string | null, zone: string | null, locale: Locale) {
  if (!instant || !zone || !validTimezone(zone) || !Number.isFinite(Date.parse(instant))) return "";
  return new Intl.DateTimeFormat(locale === "pt-BR" ? "pt-BR" : "en-US", {
    dateStyle: "medium", timeStyle: "short", timeZone: zone,
  }).format(new Date(instant));
}
export function shiftMonth(month: string, offset: number) {
  const d = new Date(month + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d.toISOString().slice(0, 7);
}
export function calendarDays(month: string) {
  const bounds = monthBounds(month);
  if (!bounds) return [];
  const weekday = new Date(bounds.start + "T00:00:00Z").getUTCDay();
  const cells: (string | null)[] = Array.from({ length: (weekday + 6) % 7 }, () => null);
  for (let day = 1; day <= Number(bounds.end.slice(-2)); day++) cells.push(month + "-" + String(day).padStart(2, "0"));
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function occursOn(event: { starts_on: string | null; ends_on: string | null }, day: string) {
  return Boolean(event.starts_on && day >= event.starts_on && day <= (event.ends_on || event.starts_on));
}
// Date-only items retain their calendar date rather than invent a UTC instant.
// Use UTC's calendar day for consistent server-side list grouping, not display.
export function eventTimeFilter(view: Exclude<View, "calendar">, now: Date) {
  const instant = now.toISOString(), day = instant.slice(0, 10);
  if (view === "upcoming") return `and(event_status.neq.completed,or(and(time_kind.eq.timed,or(starts_at.gte.${instant},ends_at.gte.${instant})),and(time_kind.neq.timed,or(starts_on.gte.${day},ends_on.gte.${day}))))`;
  return `event_status.eq.completed,and(time_kind.eq.timed,starts_at.lt.${instant},or(ends_at.is.null,ends_at.lt.${instant})),and(time_kind.neq.timed,starts_on.lt.${day},or(ends_on.is.null,ends_on.lt.${day}))`;
}
