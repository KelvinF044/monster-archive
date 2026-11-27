"use client";

import Image from "next/image";
import { useState } from "react";
import { coverUrl } from "@/lib/editorial/model";

export default function Cover({ url, alt, contain = false }: { url: string | null; alt: string; contain?: boolean }) {
  const safe = coverUrl(url);
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-purple-950 via-[#211634] to-[#0c0c11] ${contain ? "aspect-video" : "aspect-[16/9]"}`}>
      {safe && failed !== safe ? (
        <Image src={safe} alt={alt} fill unoptimized sizes="(max-width: 768px) 100vw, 800px" referrerPolicy="no-referrer" className={contain ? "object-contain" : "object-cover"} onError={() => setFailed(safe)} />
      ) : <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-black tracking-[0.2em] text-white/35">MONSTER<span className="text-purple-400">.</span></div>}
    </div>
  );
}
