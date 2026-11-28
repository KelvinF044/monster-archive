
import MembersDirectory from "@/components/MembersDirectory";
import { connection } from "next/server";
import { members } from "@/data/members";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default function MembersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#08090d] px-6 py-20 text-white">
          <div className="mx-auto max-w-7xl animate-pulse">
            <div className="h-10 w-64 rounded bg-white/10" />

            <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/5] rounded-xl bg-white/5"
                />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <MembersContent />
    </Suspense>
  );
}

async function MembersContent() {
  await connection();

  const supabase = await createClient();

  const { data: memberImages, error } = await supabase
    .from("members")
    .select("slug, image_url, image_alt")
    .eq("is_active", true);

  if (error) {
    console.error(
      "Error loading member images:",
      error.message
    );
  }

  const memberCards = members.map(({ slug, name, number, gradient }) => {
    const image = memberImages?.find((item) => item.slug === slug);

    return {
      slug,
      name,
      number,
      gradient,
      imageUrl: image?.image_url ?? null,
      imageAlt: image?.image_alt ?? null,
    };
  });

  return <MembersDirectory members={memberCards} />;
}
