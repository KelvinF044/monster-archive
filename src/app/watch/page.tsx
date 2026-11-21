
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import WatchCatalog from "@/components/WatchCatalog";

export default async function WatchPage() {
  // Aguarda uma requisição antes de executar operações dinâmicas.
  await connection();

  const { dictionary } = await getDictionary();
  const copy = dictionary.watch;

  const supabase = await createClient();

  const { data, error } = await supabase
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
    .order("display_order");

  if (error) {
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
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  return <WatchCatalog collections={data ?? []} />;
}
