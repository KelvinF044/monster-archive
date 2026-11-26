"use client";

import { useSyncExternalStore } from "react";
import { displayDate, eventClock } from "@/lib/editorial/model";
import { editorialCopy } from "@/lib/editorial/copy";
import type { Event } from "@/lib/editorial/data";
import type { Locale } from "@/lib/i18n/config";

const subscribe = () => () => {};
const clientZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => "";
export default function EventTime({ event, locale }: { event: Pick<Event,"starts_on"|"ends_on"|"starts_at"|"ends_at"|"timezone"|"time_kind">; locale: Locale }) {
  const zone = useSyncExternalStore(subscribe, clientZone, serverZone);
  const c = editorialCopy(locale);
  const { starts_on, ends_on, starts_at, ends_at, timezone, time_kind } = event;
  const start = displayDate(starts_on,locale), end = ends_on && ends_on !== starts_on ? displayDate(ends_on,locale) : "";
  const dates = start ? start + (end ? " – " + end : "") : c.dateTba;
  const original = eventClock(starts_at,timezone,locale), originalEnd = eventClock(ends_at,timezone,locale);
  if (time_kind !== "timed" || !original) return <div className="text-sm leading-6"><p className="font-bold text-zinc-200">{dates}</p><p className="text-zinc-400">{time_kind === "all_day" ? c.allDay : c.timeTba}{timezone ? ` · ${timezone}` : ""}</p></div>;
  const local = eventClock(starts_at,zone,locale), localEnd = eventClock(ends_at,zone,locale);
  return <div className="space-y-2 text-sm leading-6">
    <div><p className="text-xs text-zinc-400">{c.originalTime} · {timezone}</p><p className="font-bold text-zinc-200">{original}{originalEnd ? " – " + originalEnd : end ? " – " + end : ""}</p></div>
    {local && zone !== timezone && <div><p className="text-xs text-purple-300">{c.yourTime} · {zone}</p><p className="font-semibold">{local}{localEnd ? " – " + localEnd : ""}</p></div>}
  </div>;
}
