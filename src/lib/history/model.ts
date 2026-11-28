export const historyHref = "/library?tab=history";
export const maxPositionSeconds = 604800;

export type HistoryState = { failed?: boolean };
export type HistoryCommand = "pause" | "resume" | "remove" | "clear";

export function isVideoUuid(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
}

export function formatPlaybackPosition(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const rest = String(seconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}
