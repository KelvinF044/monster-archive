
export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-48 animate-pulse rounded bg-purple-400/20" />
        <div className="mt-5 h-12 w-72 animate-pulse rounded bg-white/10" />

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>

        <div className="mt-10 h-64 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      </div>
    </main>
  );
}
