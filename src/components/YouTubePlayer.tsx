
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type YouTubePlayerProps = {
  videoId: string;
  title: string;
  expectedPath: string;
};

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";

export default function YouTubePlayer({
  videoId,
  title,
  expectedPath,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pathname = usePathname();

  // Envia uma ordem para interromper o vídeo
  // sempre que o usuário sair da página atual.
  useEffect(() => {
    if (pathname === expectedPath) {
      return;
    }

    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: "stopVideo",
        args: [],
      }),
      YOUTUBE_ORIGIN
    );
  }, [pathname, expectedPath]);

  // Também interrompe o vídeo quando o componente
  // é desmontado ou a página é encerrada.
  useEffect(() => {
    const iframe = iframeRef.current;

    return () => {
      iframe?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "stopVideo",
          args: [],
        }),
        YOUTUBE_ORIGIN
      );
    };
  }, []);

  return (
    <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
      <iframe
        ref={iframeRef}
        src={`${YOUTUBE_ORIGIN}/embed/${encodeURIComponent(videoId)}?enablejsapi=1`}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
