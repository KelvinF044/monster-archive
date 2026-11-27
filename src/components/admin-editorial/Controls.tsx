import type { ReactNode } from "react";
import { publicUrl } from "@/lib/admin/news/model";

export const inputClass = "w-full min-w-0 rounded-lg border border-white/15 bg-[#111217] px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-purple-400";
export const buttonClass = "inline-flex items-center justify-center rounded-lg border border-white/15 px-3 py-2 text-sm font-bold text-zinc-200 hover:border-purple-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-purple-400";
export const primaryClass = "inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-purple-400";
export const panelClass = "rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-zinc-400">{label}</span>{children}</label>;
}
export function OriginalLink({ url, children }: { url: string; children: ReactNode }) {
  const safe = publicUrl(url);
  return safe ? <a className="break-words text-purple-300 hover:underline" href={safe} target="_blank" rel="noopener noreferrer">{children} ↗</a> : null;
}
export function timeLabel(value: string | null, locale: string, includeTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC", ...(includeTime ? { timeStyle: "short" as const } : {}) }).format(date);
}
