import Image from "next/image";

import type { Locale } from "@/lib/i18n/config";
import type { ProfileCatalog } from "@/lib/profiles/data";
import { profileMessages } from "@/lib/profiles/messages";
import { themeStyles, type Profile } from "@/lib/profiles/model";

export default function CommunityProfileCard({
  profile,
  catalog,
  locale,
  fallbackName,
  heading,
}: {
  profile: Profile | null;
  catalog: ProfileCatalog;
  locale: Locale;
  fallbackName?: string;
  heading: "h1" | "h2";
}) {
  const copy = profileMessages(locale);
  const Heading = heading;
  const name = profile?.display_name || fallbackName || copy.unnamed;
  const avatar = catalog.members.find((member) => member.id === profile?.avatar_member_id);
  const bias = catalog.members.find((member) => member.id === profile?.bias_member_id);
  const era = catalog.eras.find((entry) => entry.id === profile?.favorite_era_id);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();

  return (
    <section className={`overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br ${themeStyles[profile?.theme ?? "violet"]} p-6 text-white shadow-xl shadow-black/25 sm:p-9`}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <div aria-hidden="true" className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/25 bg-black/35 text-2xl font-black sm:size-24">
          {avatar?.image_url ? (
            <Image src={avatar.image_url} alt="" fill sizes="(min-width: 640px) 96px, 80px" className="object-cover object-top" />
          ) : initials}
        </div>
        <div className="min-w-0">
          <Heading className="break-words text-3xl font-black sm:text-4xl">{name}</Heading>
          {profile && <p className="mt-1 break-all text-sm text-white/80">@{profile.handle}</p>}
        </div>
      </div>
      {profile?.bio && <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-white/90">{profile.bio}</p>}
      {(bias || era) && (
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-5 text-sm">
          {bias && <div><dt className="text-white/75">{copy.bias}</dt><dd className="mt-1 font-semibold">{bias.name}</dd></div>}
          {era && <div><dt className="text-white/75">{copy.era}</dt><dd className="mt-1 font-semibold">{era.name}</dd></div>}
        </dl>
      )}
    </section>
  );
}
