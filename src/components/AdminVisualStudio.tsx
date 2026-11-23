
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminText } from "@/components/useAdminText";

type AssetKind = "home" | "member" | "collection" | "video";

type AssetTarget = {
  kind: AssetKind;
  id?: string;
  assetKey?: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  altText: string | null;
  credit: string | null;
  sourceUrl: string | null;
  fallbackUrl?: string | null;
};

type Props = {
  targets: AssetTarget[];
};

type AssetFields = {
  altText: string;
  credit: string;
  sourceUrl: string;
};

function AssetCard({
  target,
  onSave,
}: {
  target: AssetTarget;
  onSave: (
    target: AssetTarget,
    file: File,
    fields: AssetFields
  ) => Promise<void>;
}) {
  const t = useAdminText();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState(target.altText ?? "");
  const [credit, setCredit] = useState(target.credit ?? "");
  const [sourceUrl, setSourceUrl] = useState(target.sourceUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Revoke the previous preview URL when it changes or the card unmounts.
  useEffect(() => {
    if (!preview) return;

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const displayImage =
    preview || target.imageUrl || target.fallbackUrl || null;

  async function handleSave() {
    if (!file) {
      setError(t("Choose an image before saving."));
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await onSave(target, file, {
        altText,
        credit,
        sourceUrl,
      });

      setMessage(t("Image saved successfully!"));
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Unable to save this image.")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#111216]">

      {/* IMAGE PREVIEW */}

      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-black">

        {displayImage ? (
          <Image
            src={displayImage}
            alt={altText || target.title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <span className="text-4xl text-white/20">✦</span>

            <span className="mt-3 text-[10px] font-bold tracking-widest text-white/50">
              IMAGE NOT REGISTERED
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-[10px] font-bold tracking-widest text-white">
          {target.kind.toUpperCase()}
        </div>
      </div>

      {/* ASSET INFORMATION */}

      <div className="space-y-5 p-5">

        <div>
          <h3 className="text-base font-black text-white">
            {target.title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {target.description}
          </p>
        </div>

        {/* SELECT IMAGE */}

        <div>
          <label className="mb-2 block text-[10px] font-bold tracking-widest text-zinc-400">
            SELECT IMAGE
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const selectedFile =
                event.currentTarget.files?.[0] ?? null;

              setFile(selectedFile);

              setPreview(
                selectedFile
                  ? URL.createObjectURL(selectedFile)
                  : null
              );

              setError("");
              setMessage("");
            }}
            className="block w-full cursor-pointer rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-zinc-400 file:mr-3 file:rounded file:border-0 file:bg-purple-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />

          <p className="mt-2 text-[10px] text-zinc-600">
            JPEG, PNG or WebP. Maximum 5 MB.
          </p>
        </div>

        {/* ALTERNATIVE TEXT */}

        <div>
          <label className="mb-2 block text-[10px] font-bold tracking-widest text-zinc-400">
            ALTERNATIVE TEXT
          </label>

          <input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            maxLength={250}
            placeholder={t("Describe the image...")}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none focus:border-purple-400"
          />
        </div>

        {/* IMAGE CREDIT */}

        <div>
          <label className="mb-2 block text-[10px] font-bold tracking-widest text-zinc-400">
            IMAGE CREDIT
          </label>

          <input
            value={credit}
            onChange={(event) => setCredit(event.target.value)}
            maxLength={200}
            placeholder={t("Photographer, agency or license...")}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none focus:border-purple-400"
          />
        </div>

        {/* ORIGINAL IMAGE SOURCE */}

        <div>
          <label className="mb-2 block text-[10px] font-bold tracking-widest text-zinc-400">
            ORIGINAL IMAGE SOURCE
          </label>

          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            maxLength={1000}
            placeholder="https://..."
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none focus:border-purple-400"
          />
        </div>

        {/* FEEDBACK */}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-lg bg-green-500/10 p-3 text-xs text-green-400"
          >
            {message}
          </p>
        )}

        {/* SAVE BUTTON */}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !file}
          className="w-full rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? t("UPLOADING IMAGE...") : t("UPLOAD AND SAVE →")}
        </button>

      </div>
    </article>
  );
}

export default function AdminVisualStudio({ targets }: Props) {
  const router = useRouter();
  const t = useAdminText();

  const [activeCategory, setActiveCategory] = useState<
    "all" | AssetKind
  >("all");

  const [globalError, setGlobalError] = useState("");

  async function handleSave(
    target: AssetTarget,
    file: File,
    fields: AssetFields
  ) {
    setGlobalError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(t("Only JPEG, PNG and WebP images are allowed."));
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(t("The image exceeds the 5 MB limit."));
    }

    if (
      typeof crypto === "undefined" ||
      typeof crypto.randomUUID !== "function"
    ) {
      throw new Error(
        t("Your browser does not support secure image uploads.")
      );
    }

    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "webp";

    const objectPath =
      `${target.kind}/${target.slug}-${crypto.randomUUID()}.${extension}`;

    const supabase = createClient();

    // Upload image to the public archive-images bucket.
    const { error: uploadError } = await supabase.storage
      .from("archive-images")
      .upload(objectPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicData } = supabase.storage
      .from("archive-images")
      .getPublicUrl(objectPath);

    const imageUrl = publicData.publicUrl;

    let databaseError: { message: string } | null = null;
    let updated = false;

    try {
      if (target.kind === "home") {
        const { data, error } = await supabase
          .from("site_assets")
          .update({
            image_url: imageUrl,
            alt_text: fields.altText || null,
            image_credit: fields.credit || null,
            source_url: fields.sourceUrl || null,
          })
          .eq("asset_key", target.assetKey ?? "home_hero")
          .select("asset_key")
          .maybeSingle();

        databaseError = error;
        updated = Boolean(data);

      } else if (target.kind === "member") {
        if (!target.id) {
          throw new Error(t("Member identifier is missing."));
        }

        const { data, error } = await supabase
          .from("members")
          .update({
            image_url: imageUrl,
            image_alt: fields.altText || null,
            image_credit: fields.credit || null,
            image_source_url: fields.sourceUrl || null,
          })
          .eq("id", target.id)
          .select("id")
          .maybeSingle();

        databaseError = error;
        updated = Boolean(data);

      } else if (target.kind === "collection") {
        if (!target.id) {
          throw new Error(t("Collection identifier is missing."));
        }

        const { data, error } = await supabase
          .from("watch_collections")
          .update({
            cover_image_url: imageUrl,
            cover_image_alt: fields.altText || null,
            cover_image_credit: fields.credit || null,
            cover_image_source_url: fields.sourceUrl || null,
          })
          .eq("id", target.id)
          .select("id")
          .maybeSingle();

        databaseError = error;
        updated = Boolean(data);

      } else if (target.kind === "video") {
        if (!target.id) {
          throw new Error(t("Video identifier is missing."));
        }

        const { data, error } = await supabase
          .from("watch_videos")
          .update({
            thumbnail_url: imageUrl,
            thumbnail_alt: fields.altText || null,
            thumbnail_credit: fields.credit || null,
            thumbnail_source_url: fields.sourceUrl || null,
          })
          .eq("id", target.id)
          .select("id")
          .maybeSingle();

        databaseError = error;
        updated = Boolean(data);
      }

      if (databaseError) {
        throw new Error(
          `Database update failed: ${databaseError.message}`
        );
      }

      if (!updated) {
        throw new Error(
          t("No record was updated. Check your administrator permissions and try again.")
        );
      }

      router.refresh();

    } catch (err) {
      // Remove the uploaded file if its database record could not be saved.
      await supabase.storage
        .from("archive-images")
        .remove([objectPath]);

      throw err;
    }
  }

  const visibleTargets =
    activeCategory === "all"
      ? targets
      : targets.filter(
          (target) => target.kind === activeCategory
        );

  const categories = [
    { value: "all", label: t("ALL ASSETS") },
    { value: "home", label: t("HOME") },
    { value: "member", label: t("MEMBERS") },
    { value: "collection", label: t("COLLECTIONS") },
    { value: "video", label: t("VIDEOS") },
  ] as const;

  return (
    <div className="space-y-8">

      {/* CATEGORY FILTERS */}

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => setActiveCategory(category.value)}
            className={`rounded-full border px-5 py-3 text-[10px] font-bold tracking-widest transition ${
              activeCategory === category.value
                ? "border-purple-400 bg-purple-500 text-white"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-purple-400/50"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* GLOBAL ERROR */}

      {globalError && (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400"
        >
          {globalError}
        </p>
      )}

      {/* ASSET GRID */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleTargets.map((target) => (
          <AssetCard
            key={`${target.kind}-${target.id ?? target.assetKey ?? target.slug}`}
            target={target}
            onSave={handleSave}
          />
        ))}
      </div>

      {/* EMPTY STATE */}

      {visibleTargets.length === 0 && (
        <div className="rounded-xl border border-white/10 p-12 text-center text-sm text-zinc-500">
          No assets found in this category.
        </div>
      )}

    </div>
  );
}
