
import { Suspense } from "react";
import { connection } from "next/server";

import HomeHero from "@/components/HomeHero";
import HomeCatalog, {
  type HomeCollection,
} from "@/components/HomeCatalog";
import HomeAboutFooter from "@/components/HomeAboutFooter";
import HomeEditorial from "@/components/HomeEditorial";
import { homeNews, homeEvents } from "@/lib/editorial/data";

import { createClient } from "@/lib/supabase/server";

function HomeFallback() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <section className="min-h-[650px] overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#151020] via-[#0c0c12] to-[#08090d] px-6 py-28 md:min-h-[760px] md:py-36">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-8 h-3 w-64 rounded bg-white/10" />

          <div className="h-28 max-w-4xl rounded bg-white/5" />

          <div className="mt-8 h-5 max-w-xl rounded bg-white/10" />

          <div className="mt-10 flex gap-4">
            <div className="h-14 w-48 rounded bg-white/10" />
            <div className="h-14 w-44 rounded bg-white/5" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  // Mantém os dados dinâmicos protegidos pelo Suspense.
  await connection();

  const supabase = await createClient();

  const [heroResult, collectionsResult] = await Promise.all([
    supabase
      .from("site_assets")
      .select("image_url")
      .eq("asset_key", "home_hero")
      .maybeSingle(),

    supabase
      .from("watch_collections")
      .select(`
        id,
        slug,
        title,
        category,
        label,
        description,
        display_order,
        cover_image_url,
        cover_image_alt
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  if (heroResult.error) {
    console.error(
      "Error loading Home image:",
      heroResult.error.message
    );
  }

  if (collectionsResult.error) {
    console.error(
      "Error loading Home collections:",
      collectionsResult.error.message
    );
  }

  const heroImage = heroResult.data?.image_url ?? null;

  const collections = (
    collectionsResult.data ?? []
  ) as HomeCollection[];

  const collectionsError = Boolean(collectionsResult.error);

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <HomeHero heroImage={heroImage} />

      <HomeCatalog
        collections={collections}
        collectionsError={collectionsError}
      />

      <Suspense fallback={null}>
        <HomeEditorialContent />
      </Suspense>

      <HomeAboutFooter />
    </main>
  );
}

async function HomeEditorialContent() {
  const now = new Date();
  const [news, events] = await Promise.allSettled([homeNews(now), homeEvents(now)]);

  return (
    <HomeEditorial
      news={news.status === "fulfilled" ? news.value : null}
      events={events.status === "fulfilled" ? events.value : null}
    />
  );
}
