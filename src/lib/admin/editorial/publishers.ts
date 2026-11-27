export const PRESS_ARCHIVE_PAGE_LIMIT = 20;
export type PressProvider = "korea-herald" | "korea-times";
export const isPressProvider = (value: unknown): value is PressProvider => value === "korea-herald" || value === "korea-times";

export const NEWS_PROVIDERS = ["yg", "korea-herald", "korea-times", "x", "rss"] as const;
export type NewsProvider = typeof NEWS_PROVIDERS[number];

export function isNewsProvider(input: unknown): input is NewsProvider {
  return NEWS_PROVIDERS.some(provider => provider === input);
}

export const YG_REPORTS = "https://ygfamily.com/en/news/report";
export const NEWS_PRESETS = {
  yg: { name: "YG Entertainment", homepage_url: "https://ygfamily.com/", source_kind: "official_group", feed_url: null, discovery_method: "manual" },
  "korea-herald": { name: "The Korea Herald", homepage_url: "https://www.koreaherald.com/", source_kind: "trusted_press", feed_url: "https://www.koreaherald.com/rss/kh_Kpop", discovery_method: "rss" },
  "korea-times": { name: "The Korea Times", homepage_url: "https://www.koreatimes.co.kr/", source_kind: "trusted_press", feed_url: "https://feed.koreatimes.co.kr/k/entertainment.xml", discovery_method: "rss" },
  x: { name: "X — BABYMONSTER official", homepage_url: "https://x.com/YGBABYMONSTER_", source_kind: "official_group", feed_url: null, discovery_method: "api" },
} as const;

export function ygReportUrl(value: string) {
  try {
    const url = new URL(value, YG_REPORTS);
    if (!["ygfamily.com", "www.ygfamily.com"].includes(url.hostname) || !["http:", "https:"].includes(url.protocol)
      || url.username || url.password || url.port) return null;
    const report = /^\/en\/news\/report\/(\d{1,12})\/?$/.exec(url.pathname);
    return report ? YG_REPORTS + "/" + report[1] : null;
  } catch { return null; }
}

export function xPostId(value: string) {
  try {
    const url = new URL(value);
    if (!/^(?:www\.)?(?:x|twitter)\.com$/.test(url.hostname)) return null;
    return /^\/(?:[A-Za-z0-9_]+|i\/web)\/status\/(\d{1,20})\/?$/.exec(url.pathname)?.[1] ?? null;
  } catch { return null; }
}

export function discoveryUrlAliases(canonical: string) {
  const yg = ygReportUrl(canonical);
  if (yg) {
    const path = new URL(yg).pathname;
    return ["https", "http"].flatMap(scheme => ["ygfamily.com", "www.ygfamily.com"].flatMap(host =>
      ["", "/"].map(suffix => scheme + "://" + host + path + suffix)));
  }
  const url = new URL(canonical);
  const host = url.hostname.replace(/^(?:www|m)\./, "");
  if (host === "koreaherald.com" && /^\/article\/\d+\/?$/.test(url.pathname)) {
    const path = url.pathname.replace(/\/$/, "");
    return ["www.", "m.", ""].flatMap(prefix => ["", "/"].map(suffix => "https://" + prefix + host + path + suffix));
  }
  const id = xPostId(canonical);
  if (id) {
    const path = new URL(canonical).pathname.replace(/\/$/, "");
    const variants = ["x.com", "twitter.com", "www.x.com", "www.twitter.com"].flatMap(host =>
      [path, "/i/web/status/" + id, "/i/status/" + id, "/YGBABYMONSTER_/status/" + id].map(route => "https://" + host + route));
    return [...new Set([canonical, ...variants])];
  }
  return [canonical];
}
