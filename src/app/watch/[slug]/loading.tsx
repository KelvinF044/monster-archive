
export default function CollectionLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-6 h-3 w-40 animate-pulse rounded bg-purple-400/20" />

        <div className="h-16 max-w-xl animate-pulse rounded bg-white/10" />

        <div className="mt-8 h-5 max-w-2xl animate-pulse rounded bg-white/5" />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-xl border border-white/10"
            >
              <div className="aspect-video animate-pulse bg-white/10" />
              <div className="space-y-4 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-12 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
