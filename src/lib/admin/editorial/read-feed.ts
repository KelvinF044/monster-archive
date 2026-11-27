import "server-only";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import ipaddr from "ipaddr.js";
import { feedUrl } from "./model";
import { parseFeed } from "./parse-feed";

const MAX_BYTES = 1024 * 1024;
const MAX_FETCH_MS = 7000;

function isPublicAddress(address: string) {
  const ip = ipaddr.parse(address);
  if (ip.kind() === "ipv4") return ip.range() === "unicast";
  // Accept only global unicast. IPv4-mapped, special-purpose and local IPv6
  // addresses are outside this prefix or excluded by their classified range.
  return ip.range() === "unicast" && (ip.toByteArray()[0] & 0xe0) === 0x20;
}

export async function readPublicBytes(value: string, accept: string, maxBytes = MAX_BYTES) {
  const safe = feedUrl(value);
  if (!safe) throw new Error("Invalid public HTTPS URL");
  const url = new URL(safe);
  const signal = AbortSignal.timeout(MAX_FETCH_MS);
  const addresses = await new Promise<Awaited<ReturnType<typeof resolve>>>( (resolveAddresses, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    resolve(url.hostname).then(resolveAddresses, reject).finally(() => signal.removeEventListener("abort", abort));
  });
  if (!addresses.length || addresses.some(address => !isPublicAddress(address.address))) throw new Error("Source host is not public");
  const chosen = addresses.find(address => address.family === 4) ?? addresses[0];
  return new Promise<Buffer>((resolveBytes, reject) => {
    const outgoing = request(url, {
      method: "GET", agent: false, family: chosen.family, signal,
      headers: {
        "User-Agent": "MonsterArchive/1.0 editorial reader",
        "Accept": accept,
        "Accept-Encoding": "identity",
      },
      // Pin the connection to the checked address, while retaining the
      // configured hostname for Host, SNI and TLS certificate validation.
      lookup: (_hostname, _options, callback) => callback(null, chosen.address, chosen.family),
    }, response => {
      const encoding = response.headers["content-encoding"];
      if (response.statusCode !== 200 || (encoding && encoding !== "identity") || Number(response.headers["content-length"]) > maxBytes) {
        reject(new Error("Unexpected source response"));
        response.destroy();
        return;
      }
      let size = 0;
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) {
          reject(new Error("Response exceeds size limit"));
          response.destroy();
        } else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => resolveBytes(Buffer.concat(chunks)));
    });
    outgoing.on("error", reject);
    outgoing.end();
  });
}

const resolve = (hostname: string) => lookup(hostname, { all: true });

export async function readFeed(value: string) {
  const url = feedUrl(value);
  if (!url) throw new Error("Invalid feed URL");
  const bytes = await readPublicBytes(url, "application/rss+xml, application/atom+xml, application/xml, text/xml");
  return parseFeed(new TextDecoder("utf-8", { fatal: true }).decode(bytes), url);
}
