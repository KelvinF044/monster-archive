"use client";

import { useActionState, useState, type ReactNode } from "react";

import CommunityProfileCard from "@/components/CommunityProfileCard";

import { useLanguage } from "@/components/LanguageProvider";
import { saveProfile } from "@/lib/profiles/actions";
import type { ProfileCatalog } from "@/lib/profiles/data";
import { profileMessages } from "@/lib/profiles/messages";
import { themeStyles, type Profile, type Sharing, type Theme } from "@/lib/profiles/model";

const fieldStyle = "mt-2 w-full min-w-0 rounded-lg border border-white/20 bg-[#121019] px-3 py-2.5 text-sm text-white focus-visible:border-purple-400 focus-visible:outline-1 focus-visible:outline-purple-400";
const labelStyle = "block min-w-0 text-sm font-semibold text-zinc-100";

function ProfileSelect({ label, name, value, options, empty, archived, change }: {
  label: string;
  name: string;
  value: string;
  options: { id: string; name: string }[];
  empty: string;
  archived: string;
  change: (value: string) => void;
}) {
  return (
    <label className={labelStyle}>
      {label}
      <select name={name} value={value} onChange={(event) => change(event.currentTarget.value)} className={fieldStyle}>
        <option value="">{empty}</option>
        {value && !options.some((option) => option.id === value) && <option value={value}>{archived}</option>}
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  );
}

export default function CommunityProfileForm({
  profile, sharing, catalog, fallbackName, children,
}: {
  profile: Profile | null;
  sharing: Sharing | null;
  catalog: ProfileCatalog;
  fallbackName: string;
  children: ReactNode;
}) {
  const { locale } = useLanguage();
  const copy = profileMessages(locale);
  const [state, submit, pending] = useActionState(saveProfile, {});
  const [values, setValues] = useState({
    displayName: profile?.display_name ?? fallbackName,
    handle: profile?.handle ?? "",
    bio: profile?.bio ?? "",
    avatar: profile?.avatar_member_id ?? "",
    bias: profile?.bias_member_id ?? "",
    era: profile?.favorite_era_id ?? "",
    theme: profile?.theme ?? "violet",
    visibility: profile?.is_public ? "public" : "private",
    shareFavorites: sharing?.share_favorites ?? false,
    shareHistory: sharing?.share_history ?? false,
  });

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  const draft: Profile = {
    handle: values.handle.trim().toLowerCase(),
    display_name: values.displayName.trim(),
    bio: values.bio.trim(),
    avatar_member_id: values.avatar || null,
    bias_member_id: values.bias || null,
    favorite_era_id: values.era || null,
    theme: values.theme,
    is_public: profile?.is_public ?? false,
  };
  const preview = (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-zinc-200">{copy.preview}</p>
      <CommunityProfileCard profile={draft} catalog={catalog} locale={locale} heading="h2" />
    </div>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
      <section className="order-2 min-w-0 space-y-4 lg:order-1">
        <div className="hidden lg:block">{preview}</div>
        {children}
      </section>
      <form action={submit} className="order-1 rounded-2xl border border-white/10 bg-[#100e19]/85 p-5 sm:p-7 lg:order-2">
        <h2 className="mb-5 text-xl font-bold">{copy.editProfile}</h2>
        <fieldset disabled={pending} className="space-y-5 disabled:opacity-65">
          <div className="grid gap-5 md:grid-cols-2">
            <label className={labelStyle}>
              {copy.displayName}
              <input name="displayName" value={values.displayName} onChange={(event) => update("displayName", event.currentTarget.value)} required maxLength={40} autoComplete="nickname" className={fieldStyle} />
            </label>
            <label className={labelStyle}>
              {copy.handle}
              <input name="handle" value={values.handle} onChange={(event) => update("handle", event.currentTarget.value)} required minLength={3} maxLength={24} pattern="[A-Za-z0-9][A-Za-z0-9_]{2,23}" autoComplete="username" autoCapitalize="none" spellCheck={false} aria-describedby="profile-handle-hint" className={fieldStyle} />
              <span id="profile-handle-hint" className="mt-2 block text-xs font-normal text-zinc-400">{copy.handleHint}</span>
            </label>
          </div>
          <label className={labelStyle}>
            {copy.bio}
            <textarea name="bio" value={values.bio} onChange={(event) => update("bio", event.currentTarget.value)} rows={3} maxLength={280} className={fieldStyle} />
          </label>
          <div className="grid gap-5 sm:grid-cols-3">
            <ProfileSelect name="avatarMember" label={copy.avatar} value={values.avatar} options={catalog.members.filter((member) => member.image_url)} empty={copy.initials} archived={copy.archived} change={(value) => update("avatar", value)} />
            <ProfileSelect name="bias" label={copy.bias} value={values.bias} options={catalog.members} empty={copy.none} archived={copy.archived} change={(value) => update("bias", value)} />
            <ProfileSelect name="era" label={copy.era} value={values.era} options={catalog.eras} empty={copy.none} archived={copy.archived} change={(value) => update("era", value)} />
          </div>
          <fieldset>
            <legend className={labelStyle}>{copy.theme}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(Object.keys(themeStyles) as Theme[]).map((theme) => (
                <label key={theme} className={`flex items-center gap-2 rounded-lg border border-white/15 bg-gradient-to-br ${themeStyles[theme]} px-3 py-2.5 text-sm font-semibold`}>
                  <input type="radio" name="theme" value={theme} checked={values.theme === theme} onChange={() => update("theme", theme)} className="accent-purple-400" />
                  {copy[theme]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="lg:hidden">{preview}</div>
          <fieldset className="space-y-3 border-t border-white/10 pt-5">
            <legend className="sr-only">{copy.privacy}</legend>
            <h3 className="font-bold">{copy.privacy}</h3>
            <label className={labelStyle}>
              {copy.visibility}
              <select name="visibility" value={values.visibility} onChange={(event) => update("visibility", event.currentTarget.value)} className={fieldStyle}>
                <option value="private">{copy.private}</option>
                <option value="public">{copy.public}</option>
              </select>
            </label>
            <p className="text-sm leading-relaxed text-zinc-400">{copy.privacyHint}</p>
            <label className="flex items-center gap-2 text-sm"><input name="shareFavorites" type="checkbox" checked={values.shareFavorites} onChange={(event) => update("shareFavorites", event.currentTarget.checked)} className="accent-purple-400" />{copy.favorites}</label>
            <label className="flex items-center gap-2 text-sm"><input name="shareHistory" type="checkbox" checked={values.shareHistory} onChange={(event) => update("shareHistory", event.currentTarget.checked)} className="accent-purple-400" />{copy.history}</label>
            <p className="text-sm leading-relaxed text-zinc-400">{copy.sharingHint}</p>
          </fieldset>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button type="submit" className="rounded-lg bg-purple-700 px-5 py-3 text-sm font-bold text-white hover:bg-purple-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400">
              {pending ? copy.saving : copy.save}
            </button>
            {state.result && <p role="alert" className="text-sm text-red-200">{copy[state.result]}</p>}
          </div>
        </fieldset>
      </form>
    </div>
  );
}

export function CopyProfileLink({ handle }: { handle: string }) {
  const { locale } = useLanguage();
  const copy = profileMessages(locale);
  const [result, setResult] = useState<"copied" | "copyFailed">();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(`/u/${handle}`, window.location.origin).href);
      setResult("copied");
    } catch {
      setResult("copyFailed");
    }
  }

  return (
    <div>
      <button type="button" onClick={copyLink} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-purple-400">{copy.copyLink}</button>
      {result && <p role="status" className="mt-2 text-xs text-zinc-300">{copy[result]}</p>}
    </div>
  );
}
