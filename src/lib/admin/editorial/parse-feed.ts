import { SaxesParser } from "saxes";
import { parseDiscovery, type Discovery } from "./model.ts";

const MAX_ENTRIES = 250;
const TEXT_LIMIT = 5000;
type Entry = {
  title: string; link: string; id: string; excerpt: string; date: string; language: string; depth: number;
};

function plainText(value: string) {
  return value.replace(/<[^<>]*>/g, " ").replace(/&(?:nbsp|#160);/gi, " ").replace(/\s+/g, " ").trim();
}

export function parseFeed(xml: string, url: string): Discovery[] {
  const parser = new SaxesParser({ xmlns: true });
  const items: Discovery[] = [];
  let depth = 0, scanned = 0;
  let feedType: "rss" | "atom" | "" = "";
  let rootLanguage = "";
  let entry: Entry | undefined;
  let capture: { key: keyof Omit<Entry, "depth">; depth: number; text: string } | undefined;

  parser.on("doctype", () => { throw new Error("Feed DTD is not supported"); });
  parser.on("opentag", node => {
    depth++;
    if (depth > 64) throw new Error("Feed nesting limit");
    const name = node.local.toLowerCase();
    if (depth === 1) {
      if (name === "rss" || name === "rdf") feedType = "rss";
      if (name === "feed") feedType = "atom";
      rootLanguage = node.attributes["xml:lang"]?.value ?? "";
    }
    const itemDepth = feedType === "rss" ? (name === "item" && (depth === 2 || depth === 3)) : (feedType === "atom" && name === "entry" && depth === 2);
    if (!entry && itemDepth && scanned++ < MAX_ENTRIES) {
      entry = { title: "", link: "", id: "", excerpt: "", date: "", language: node.attributes["xml:lang"]?.value ?? "", depth };
      return;
    }
    if (!entry || depth !== entry.depth + 1) return;
    if (name === "link" && feedType === "atom") {
      const rel = node.attributes.rel?.value;
      if ((!rel || rel === "alternate") && !entry.link) entry.link = node.attributes.href?.value ?? "";
      return;
    }
    const keys: Record<string, keyof Omit<Entry, "depth">> = {
      title: "title", link: "link", guid: "id", id: "id", description: "excerpt", summary: "excerpt",
      pubdate: "date", published: "date", updated: "date", date: "date",
    };
    const key = keys[name];
    if (Object.hasOwn(keys, name) && (!entry[key] || name === "published")) capture = { key, depth, text: "" };
  });
  const accumulate = (value: string) => {
    if (capture && capture.text.length < TEXT_LIMIT) capture.text += value.slice(0, TEXT_LIMIT - capture.text.length);
  };
  parser.on("text", accumulate);
  parser.on("cdata", accumulate);
  parser.on("closetag", () => {
    if (entry && capture && depth === capture.depth) {
      entry[capture.key] = capture.text.trim();
      capture = undefined;
    }
    if (entry && depth === entry.depth) {
      try {
        const title = plainText(entry.title).slice(0, 250);
        const excerpt = plainText(entry.excerpt).split(" ").slice(0, 24).join(" ").slice(0, 250);
        const date = Date.parse(entry.date);
        const language = entry.language || rootLanguage;
        if (entry.link) {
          const discovery = parseDiscovery({
            source_url: new URL(entry.link, url).href, original_title: title, original_excerpt: excerpt,
            external_id: entry.id.slice(0, 512), original_language: /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(language) ? language : "",
            source_published_at: Number.isFinite(date) && new Date(date).getUTCFullYear() >= 1900 && new Date(date).getUTCFullYear() <= 9998 ? new Date(date).toISOString() : "",
          });
          if (discovery) items.push(discovery);
        }
      } catch { /* Skip a malformed item without discarding other entries. */ }
      entry = undefined;
    }
    depth--;
  });
  parser.write(xml).close();
  if (!feedType) throw new Error("Expected an RSS or Atom feed");
  return items;
}
