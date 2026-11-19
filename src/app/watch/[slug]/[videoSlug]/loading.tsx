
export default function VideoLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">

        <div className="mb-6 h-3 w-44 animate-pulse rounded bg-purple-400/20" />

        <div className="mb-8 h-12 max-w-2xl animate-pulse rounded bg-white/10" />

        <div className="aspect-video w-full animate-pulse rounded-xl border border-white/10 bg-white/5" />

        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_300px]">

          <div className="space-y-5">
            <div className="h-4 w-40 animate-pulse rounded bg-purple-400/20" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-16 w-full animate-pulse rounded bg-white/5" />
          </div>

          <div className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />

        </div>

      </section>

    </main>
  );
}
