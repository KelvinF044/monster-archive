"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { queueHistoryWrite } from "@/lib/history/client";
import { maxPositionSeconds } from "@/lib/history/model";

type YouTubePlayerProps = {
  videoId: string;
  title: string;
  expectedPath: string;
  origin?: string;
  startSeconds?: number;
  history?: { videoId: string; version: number };
};

type Player = { getCurrentTime: () => number; getPlayerState: () => number };
type PlayerEvent = { target: Player };
type YouTubeApi = {
  Player: new (iframe: HTMLIFrameElement, config: {
    events: {
      onReady: (event: PlayerEvent) => void;
      onStateChange: (event: PlayerEvent & { data: number }) => void;
    };
  }) => Player;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";
const HISTORY_INTERVAL_MS = 15_000;
let loader: Promise<YouTubeApi> | undefined;

function loadYouTubeApi() {
  const browser = window as Window & { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void };
  if (browser.YT?.Player) return Promise.resolve(browser.YT);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const previous = browser.onYouTubeIframeAPIReady;
    browser.onYouTubeIframeAPIReady = () => {
      if (browser.YT) resolve(browser.YT);
      previous?.();
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      browser.onYouTubeIframeAPIReady = previous;
      script.remove();
      loader = undefined;
      reject(new Error("YouTube player API unavailable"));
    };
    document.head.appendChild(script);
  });
  return loader;
}

export default function YouTubePlayer({
  videoId, title, expectedPath, origin, startSeconds = 0, history,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const connectionRef = useRef<{ iframe: HTMLIFrameElement; readyPlayer?: Player }>(null);
  const onPlayerStateRef = useRef<((player: Player, state: number) => void) | null>(null);
  const pathname = usePathname();
  const trackedVideo = history?.videoId;
  const version = history?.version;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !trackedVideo || version === undefined || pathname !== expectedPath) return;

    let player: Player | undefined;
    let watched = false;
    let completed = false;
    let disposed = false;
    let inactive = false;
    let lastRecord = "";
    let lastPosition: number | undefined;

    function report() {
      if (!player || !watched || inactive) return;
      const position = Math.floor(player.getCurrentTime());
      if (Number.isFinite(position) && position >= 0 && position <= maxPositionSeconds) {
        lastPosition = position;
      }
      if (lastPosition === undefined) return;
      const record = `${lastPosition}:${completed}`;
      if (record === lastRecord) return;
      lastRecord = record;

      const body = JSON.stringify({ videoId: trackedVideo, version, position: lastPosition, completed });
      queueHistoryWrite(async () => {
        if (inactive) return;
        try {
          const response = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          });
          if (response.status === 401 || response.status === 409) {
            inactive = true;
            clearInterval(timer);
          } else if (!response.ok && lastRecord === record) {
            lastRecord = "";
          }
        } catch {
          if (lastRecord === record) lastRecord = "";
        }
      });
    }

    function flushWhenHidden() {
      if (document.visibilityState === "hidden") report();
    }

    const timer = setInterval(report, HISTORY_INTERVAL_MS);
    void loadYouTubeApi().then((api) => {
      if (disposed) return;
      const { PLAYING, PAUSED, ENDED } = api.PlayerState;
      onPlayerStateRef.current = (target, state) => {
        player = target;
        if (state === PLAYING) {
          watched = true;
          completed = false;
          report();
        } else if (state === ENDED && watched) {
          completed = true;
          report();
        } else if (state === PAUSED) {
          report();
        }
      };

      // Next.js can hide and restore the same iframe during client navigation.
      // Keep one IFrame API binding per element and reconnect its listeners.
      const existing = connectionRef.current;
      if (existing?.iframe === iframe) {
        const readyPlayer = existing.readyPlayer;
        if (readyPlayer?.getPlayerState) onPlayerStateRef.current(readyPlayer, readyPlayer.getPlayerState());
        return;
      }

      const binding: { iframe: HTMLIFrameElement; readyPlayer?: Player } = { iframe };
      connectionRef.current = binding;
      new api.Player(iframe, {
        events: {
          onReady: ({ target }) => {
            binding.readyPlayer = target;
            if (connectionRef.current === binding) onPlayerStateRef.current?.(target, target.getPlayerState());
          },
          onStateChange: ({ data, target }) => {
            binding.readyPlayer = target;
            if (connectionRef.current === binding) onPlayerStateRef.current?.(target, data);
          },
        },
      });
    }).catch(() => { /* Playback works independently of history. */ });

    window.addEventListener("pagehide", report);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      report();
      disposed = true;
      onPlayerStateRef.current = null;
      clearInterval(timer);
      window.removeEventListener("pagehide", report);
      document.removeEventListener("visibilitychange", flushWhenHidden);
    };
  }, [expectedPath, pathname, trackedVideo, version]);

  useEffect(() => {
    const iframe = iframeRef.current;
    function stop() {
      iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "stopVideo", args: [] }),
        YOUTUBE_ORIGIN,
      );
    }

    if (pathname !== expectedPath) stop();
    return stop;
  }, [expectedPath, pathname]);

  const params = new URLSearchParams({ enablejsapi: "1" });
  if (origin) params.set("origin", origin);
  if (startSeconds > 0) params.set("start", String(startSeconds));

  return (
    <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
      <iframe
        ref={iframeRef}
        src={`${YOUTUBE_ORIGIN}/embed/${encodeURIComponent(videoId)}?${params}`}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
