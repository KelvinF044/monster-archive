"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { buttonClass } from "./Controls";

export default function SourceCover({ candidateId, disabled, selectedHash, onSelect }: {
  candidateId: string;
  disabled: boolean;
  selectedHash: string | null;
  onSelect: (hash: string | null) => void;
}) {
  const { locale } = useAdminLocale();
  const pt = locale === "pt-BR";
  const [preview, setPreview] = useState<{ url: string; hash: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previewUrl = preview?.url;
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function load() {
    setBusy(true);
    setError("");
    onSelect(null);
    setPreview(null);
    try {
      const response = await fetch("/api/admin/editorial/cover?id=" + encodeURIComponent(candidateId), { cache: "no-store" });
      const hash = response.headers.get("X-Editorial-Cover-Hash");
      if (!response.ok || !hash) {
        setError(response.status === 404 ? "missing" : "unavailable");
        return;
      }
      const blob = await response.blob();
      setPreview({ url: URL.createObjectURL(blob), hash });
    } catch { setError("unavailable"); }
    finally { setBusy(false); }
  }

  return <section className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
    <h3 className="text-sm font-bold">{pt ? "Imagem da publicação original" : "Original report image"}</h3>
    <button type="button" className={buttonClass} disabled={busy || disabled} onClick={() => void load()}>
      {busy ? (pt ? "Carregando…" : "Loading…") : preview
        ? (pt ? "Recarregar prévia" : "Reload preview") : (pt ? "Ver imagem do comunicado" : "Preview report image")}
    </button>
    {error && <p role="status" className="text-sm text-zinc-400">{error === "missing"
      ? (pt ? "Nenhuma imagem compatível foi encontrada no comunicado." : "No compatible image was found in the report.")
      : (pt ? "Não foi possível carregar a imagem agora." : "The image could not be loaded.")}</p>}
    {preview && <>
      <div className="relative aspect-[4/3] max-h-80 max-w-xl overflow-hidden rounded-lg bg-black/40">
        <Image src={preview.url} alt={pt ? "Prévia da imagem da YG" : "Preview of the YG image"} fill unoptimized sizes="(max-width: 640px) 100vw, 576px" className="object-contain" />
      </div>
      <label className="flex items-start gap-2 text-sm text-zinc-200">
        <input type="checkbox" checked={selectedHash === preview.hash} disabled={disabled}
          onChange={event => onSelect(event.target.checked ? preview.hash : null)} className="mt-0.5 accent-purple-500" />
        {pt ? "Usar esta imagem como capa (tenho autorização para usá-la)" : "Use this image as the cover (I have permission to use it)"}
      </label>
    </>}
  </section>;
}
