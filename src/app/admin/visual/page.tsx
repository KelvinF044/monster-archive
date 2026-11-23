
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { translateAdminText } from "@/lib/i18n/admin";
import AdminVisualStudio from "@/components/AdminVisualStudio";

export default function AdminVisualPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#08090d] p-10 text-white">
          <div className="mx-auto max-w-7xl animate-pulse">
            <div className="h-12 w-80 rounded bg-white/10" />
            <div className="mt-10 h-80 rounded-xl bg-white/[0.03]" />
          </div>
        </main>
      }
    >
      <AdminVisualContent />
    </Suspense>
  );
}

async function AdminVisualContent() {
  await connection();
  const locale = await getLocale();
  const t = (value: string) => translateAdminText(locale, value);

  const supabase = await createClient();

  // Verify authenticated administrator
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!admin) {
    redirect("/admin/login?access=denied");
  }

  // Load all visual assets and related records
  const [
    heroResult,
    membersResult,
    collectionsResult,
    videosResult,
  ] = await Promise.all([

    supabase
      .from("site_assets")
      .select("asset_key, image_url, alt_text, image_credit, source_url")
      .eq("asset_key", "home_hero")
      .maybeSingle(),

    supabase
      .from("members")
      .select(
        "id, slug, name, image_url, image_alt, image_credit, image_source_url"
      )
      .eq("is_active", true)
      .order("display_order"),

    supabase
      .from("watch_collections")
      .select(
        "id, slug, title, category, cover_image_url, cover_image_alt, cover_image_credit, cover_image_source_url"
      )
      .eq("is_active", true)
      .order("display_order"),

    supabase
      .from("watch_videos")
      .select(
        "id, slug, title, youtube_video_id, thumbnail_url, thumbnail_alt, thumbnail_credit, thumbnail_source_url"
      )
      .order("created_at", { ascending: false }),

  ]);

  const loadError =
    heroResult.error ||
    membersResult.error ||
    collectionsResult.error ||
    videosResult.error;

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#08090d] p-8 text-white">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-500/20 p-8">
          <h1 className="text-2xl font-black text-red-400">
            Unable to load Visual Studio
          </h1>

          <p className="mt-4 text-sm text-zinc-400">
            {loadError.message}
          </p>

          <Link
            href="/admin"
            className="mt-8 inline-block text-sm font-bold text-purple-400"
          >
            ← BACK TO DASHBOARD
          </Link>
        </div>
      </main>
    );
  }

  const hero = heroResult.data;

  const targets = [

    // HOME HERO
    {
      kind: "home" as const,
      assetKey: "home_hero",
      slug: "home-hero",
      title: t("Home Hero — DRIP Era"),
      description: t("Main homepage photograph featuring the seven members."),
      imageUrl: hero?.image_url ?? null,
      altText: hero?.alt_text ?? null,
      credit: hero?.image_credit ?? null,
      sourceUrl: hero?.source_url ?? null,
    },

    // MEMBERS
    ...(membersResult.data ?? []).map((member) => ({
      kind: "member" as const,
      id: member.id,
      slug: member.slug,
      title: member.name,
      description: `${t("Official individual photograph for")} ${member.name}.`,
      imageUrl: member.image_url,
      altText: member.image_alt,
      credit: member.image_credit,
      sourceUrl: member.image_source_url,
    })),

    // COLLECTION COVERS
    ...(collectionsResult.data ?? []).map((collection) => ({
      kind: "collection" as const,
      id: collection.id,
      slug: collection.slug,
      title: collection.title,
      description: t(`${collection.category} collection cover.`),
      imageUrl: collection.cover_image_url,
      altText: collection.cover_image_alt,
      credit: collection.cover_image_credit,
      sourceUrl: collection.cover_image_source_url,
    })),

    // VIDEO THUMBNAILS
    ...(videosResult.data ?? []).map((video) => ({
      kind: "video" as const,
      id: video.id,
      slug: video.slug,
      title: video.title,
      description: t("Custom video thumbnail. YouTube thumbnail is used as fallback."),
      imageUrl: video.thumbnail_url,
      altText: video.thumbnail_alt,
      credit: video.thumbnail_credit,
      sourceUrl: video.thumbnail_source_url,
      fallbackUrl: video.youtube_video_id
        ? `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`
        : null,
    })),

  ];

  const registeredImages = targets.filter(
    (target) => Boolean(target.imageUrl)
  ).length;

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-8">

          <div>
            <Link
              href="/admin"
              className="text-xs font-bold text-zinc-500 transition hover:text-white"
            >
              ← BACK TO DASHBOARD
            </Link>

            <p className="mt-7 text-xs font-bold tracking-[0.3em] text-purple-400">
              MONSTER ARCHIVE / DESIGN SYSTEM
            </p>

            <h1 className="mt-3 text-4xl font-black">
              Visual Studio.
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Manage the visual identity of your global fan archive.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-white/10 px-5 py-3 text-xs font-bold text-zinc-400 transition hover:text-white"
          >
            VIEW WEBSITE ↗
          </Link>

        </header>

        {/* OVERVIEW */}

        <section className="mt-9 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold tracking-widest text-zinc-500">
              IMAGE SLOTS
            </p>

            <p className="mt-3 text-4xl font-black">
              {targets.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold tracking-widest text-zinc-500">
              CUSTOM IMAGES
            </p>

            <p className="mt-3 text-4xl font-black">
              {registeredImages}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold tracking-widest text-zinc-500">
              AWAITING IMAGES
            </p>

            <p className="mt-3 text-4xl font-black">
              {targets.length - registeredImages}
            </p>
          </div>

        </section>

        {/* IMAGE MANAGEMENT */}

        <section className="mt-12">

          <div className="mb-7">
            <h2 className="text-xl font-black">
              Archive Image Library
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Upload, preview and manage the images used throughout the website.
            </p>
          </div>

          <AdminVisualStudio targets={targets} />

        </section>

        <footer className="mt-16 border-t border-white/10 py-8 text-center text-xs text-zinc-600">
          MONSTER ARCHIVE · VISUAL MANAGEMENT SYSTEM
        </footer>

      </div>

    </main>
  );
}
