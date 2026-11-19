
import Link from "next/link";
import { members } from "@/data/members";

export default function MembersPage() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <header className="border-b border-white/10 bg-[#08090d]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black tracking-[0.18em]">
            MONSTER<span className="text-purple-400">.</span>
          </Link>

          <Link href="/" className="text-sm text-zinc-400 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20">

        <div className="mb-14">
          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-purple-400">
            GET TO KNOW THEM
          </p>

          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            THE MEMBERS<span className="text-purple-400">.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            Discover the seven members of BABYMONSTER.
            Explore their stories, performances, activities
            and unforgettable moments.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <h2 className="text-sm font-bold tracking-widest">
            ALL MEMBERS
          </h2>

          <span className="text-xs text-zinc-500">
            07 MEMBERS
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {members.map((member) => (
            <Link
              key={member.slug}
              href={`/members/${member.slug}`}
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-purple-400/50"
            >
              <div className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br ${member.gradient}`}>

                <div className="absolute inset-0 bg-black/20 transition group-hover:bg-transparent" />

                <span className="absolute left-5 top-5 text-xs font-bold tracking-widest text-white/50">
                  MEMBER {member.number}
                </span>

                <span className="relative text-7xl font-black tracking-tighter text-white/10 transition duration-500 group-hover:scale-110">
                  {member.number}
                </span>

                <span className="absolute bottom-5 left-5 text-xs font-bold tracking-[0.2em] text-white/50">
                  BABYMONSTER
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-2xl font-black tracking-wide">
                  {member.name}
                </h3>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500">
                    MEMBER PROFILE
                  </span>

                  <span className="text-purple-400">
                    ↗
                  </span>
                </div>
              </div>
            </Link>
          ))}

        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-xs text-zinc-600">
          <span className="font-black tracking-widest">
            MONSTER ARCHIVE
          </span>

          <span>
            Independent fan-made project. Not affiliated with YG Entertainment.
          </span>
        </div>
      </footer>

    </main>
  );
}
