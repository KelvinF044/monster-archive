"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { maxPositionSeconds } from "@/lib/history/model";

type YouTubePlayerProps = {
  videoId: string;
  title: string;
  expectedPath: string;
  startSeconds?: number;
  history?: { videoId: string; version: number };
};

type Player = { getCurrentTime: () => number };
type YouTubeApi = {
  Player: new (iframe: HTMLIFrameElement, config: {
    events: { onStateChange: (event: { data: number; target: Player }) => void };
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
  videoId, title, expectedPath, startSeconds = 0, history,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pathname = usePathname();
  const trackedVideo = history?.videoId;
  const version = history?.version;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !trackedVideo || version === undefined || pathname !== expectedPath) return;

    let player: Player | undefined;
    let playing = false;
    let watched = false;
    let completed = false;
    let disposed = false;
    let inactive = false;
    let lastRecord = "";
    let pending = Promise.resolve();
    let timer: ReturnType<typeof setInterval> | undefined;

    function report() {
      if (!player || !watched || inactive) return;
      const position = Math.floor(player.getCurrentTime());
      if (!Number.isFinite(position) || position < 0 || position > maxPositionSeconds) return;
      const record = `${position}:${completed}`;
      if (record === lastRecord) return;
      lastRecord = record;

      const body = JSON.stringify({ videoId: trackedVideo, version, position, completed });
      pending = pending.then(async () => {
        if (inactive) return;
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
      }).catch(() => {
        if (lastRecord === record) lastRecord = "";
      });
    }

    void loadYouTubeApi().then((api) => {
      if (disposed) return;
      player = new api.Player(iframe, {
        events: {
          onStateChange: ({ data, target }) => {
            if (disposed || inactive) return;
            player = target;
            clearInterval(timer);
            playing = data === api.PlayerState.PLAYING;
            if (playing) {
              watched = true;
              completed = false;
              report();
              timer = setInterval(report, HISTORY_INTERVAL_MS);
            } else if (data === api.PlayerState.ENDED && watched) {
              completed = true;
              report();
            } else if (data === api.PlayerState.PAUSED) {
              report();
            }
          },
        },
      });
    }).catch(() => { /* Playback works independently of history. */ });

    window.addEventListener("pagehide", report);
    return () => {
      disposed = true;
      if (playing) report();
      clearInterval(timer);
      window.removeEventListener("pagehide", report);
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
