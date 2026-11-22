
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

import WatchCatalog from "@/components/WatchCatalog";

export default async function WatchPage() {
  await connection();

  const { dictionary } = await getDictionary();
  const copy = dictionary.watch;

  const supabase = await createClient();

  const [collectionsResult, heroResult] = await Promise.all([
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
      .order("display_order"),

    supabase
      .from("site_assets")
      .select("image_url")
      .eq("asset_key", "home_hero")
      .maybeSingle(),
  ]);

  if (collectionsResult.error) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#08090d] px-6 text-white">
        <div className="max-w-lg rounded-xl border border-red-500/20 bg-white/[0.03] p-8">
          <h1 className="text-xl font-black text-red-400">
            {copy.errorTitle}
          </h1>

          <p className="mt-4 text-sm leading-7 text-zinc-400">
            {copy.errorDescription}
          </p>

          <p className="mt-4 break-words text-xs text-zinc-600">
            {collectionsResult.error.message}
          </p>
        </div>
      </main>
    );
  }

  if (heroResult.error) {
    console.error(
      "Error loading Watch hero image:",
      heroResult.error.message
    );
  }

  return (
    <WatchCatalog
      collections={collectionsResult.data ?? []}
      heroImageUrl={heroResult.data?.image_url ?? null}
    />
  );
}
