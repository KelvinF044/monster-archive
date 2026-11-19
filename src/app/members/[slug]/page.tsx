
import Link from "next/link";
import { notFound } from "next/navigation";
import { members } from "@/data/members";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return members.map((member) => ({
    slug: member.slug,
  }));
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const member = members.find((item) => item.slug === slug);

  if (!member) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <section className="mx-auto max-w-7xl px-6 py-16">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-purple-400">
          BABYMONSTER / MEMBER ARCHIVE / {member.number}
        </p>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">

          <div>
            <h1 className="text-6xl font-black tracking-tight md:text-8xl">
              {member.name}
              <span className="text-purple-400">.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400">
              Explore the archive dedicated to {member.name}.
              Discover performances, interviews, activities
              and memorable moments throughout the BABYMONSTER journey.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#about"
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-black hover:bg-purple-200"
              >
                EXPLORE PROFILE
              </a>

              <Link
                href="/members"
                className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold hover:bg-white/10"
              >
                ALL MEMBERS
              </Link>
            </div>
          </div>

          <div className={`relative flex aspect-[4/5] max-h-[500px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${member.gradient}`}>
            <span className="absolute left-6 top-6 text-xs font-bold tracking-[0.3em] text-white/50">
              MEMBER {member.number}
            </span>

            <span className="text-[180px] font-black text-white/10">
              {member.number}
            </span>

            <span className="absolute bottom-6 left-6 text-xs font-bold tracking-[0.3em] text-white/50">
              BABYMONSTER
            </span>
          </div>

        </div>
      </section>

      <section
        id="about"
        className="border-t border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-purple-400">
            MEMBER INFORMATION
          </p>

          <h2 className="text-3xl font-black">
            ABOUT {member.name}
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-zinc-400">
            This profile is dedicated to organizing verified information,
            official content and archive entries related to {member.name}.
            More information will be added as the archive develops.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">

            {[
              { title: "PERFORMANCES", detail: "Stages and live appearances" },
              { title: "VARIETY", detail: "Shows and interviews" },
              { title: "BEHIND", detail: "Behind the scenes and special content" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-sm font-black tracking-wider text-white">
                  {item.title}
                </p>

                <p className="mt-3 text-sm text-zinc-500">
                  {item.detail}
                </p>

                <p className="mt-6 text-xs text-purple-400">
                  ARCHIVE COMING SOON
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl justify-between gap-4 text-xs text-zinc-600">
          <span className="font-black tracking-widest">MONSTER ARCHIVE</span>
          <span>Independent fan-made project.</span>
        </div>
      </footer>

    </main>
  );
}
