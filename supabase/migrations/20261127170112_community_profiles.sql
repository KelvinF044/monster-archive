begin;

create table public.community_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (
    handle collate "C" ~ '^[a-z0-9][a-z0-9_]{2,23}$'
    and handle not in ('admin', 'administrator', 'moderator', 'support', 'monsterarchive', 'monster_archive')
  ),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 280),
  avatar_member_id uuid references public.members (id) on delete set null,
  bias_member_id uuid references public.members (id) on delete set null,
  favorite_era_id uuid references public.watch_eras (id) on delete set null,
  theme text not null default 'violet' check (theme in ('violet', 'rose', 'midnight')),
  is_public boolean not null default false
);

create table public.community_profile_settings (
  user_id uuid primary key references public.community_profiles (user_id) on delete cascade,
  share_favorites boolean not null default false,
  share_history boolean not null default false
);

alter table public.community_profiles enable row level security;
alter table public.community_profile_settings enable row level security;

revoke all on public.community_profiles, public.community_profile_settings from public, anon, authenticated;
grant select (handle, display_name, bio, avatar_member_id, bias_member_id, favorite_era_id, theme, is_public)
  on public.community_profiles to anon;
grant select, insert, update on public.community_profiles, public.community_profile_settings to authenticated;

create policy "Visitors see published profiles"
  on public.community_profiles for select to anon
  using (is_public);

create policy "Members see their profile"
  on public.community_profiles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Members create their profile"
  on public.community_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Members update their profile"
  on public.community_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Members see their sharing settings"
  on public.community_profile_settings for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Members create their sharing settings"
  on public.community_profile_settings for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Members update their sharing settings"
  on public.community_profile_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function public.save_community_profile(
  profile_handle text, profile_display_name text, profile_bio text, profile_avatar_member_id uuid,
  profile_bias_member_id uuid, profile_favorite_era_id uuid, profile_theme text, profile_is_public boolean,
  profile_share_favorites boolean, profile_share_history boolean
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise insufficient_privilege;
  end if;

  insert into public.community_profiles (
    user_id, handle, display_name, bio, avatar_member_id, bias_member_id, favorite_era_id, theme, is_public
  ) values (
    owner_id, profile_handle, profile_display_name, profile_bio, profile_avatar_member_id,
    profile_bias_member_id, profile_favorite_era_id, profile_theme, profile_is_public
  )
  on conflict (user_id) do update set
    handle = excluded.handle,
    display_name = excluded.display_name,
    bio = excluded.bio,
    avatar_member_id = excluded.avatar_member_id,
    bias_member_id = excluded.bias_member_id,
    favorite_era_id = excluded.favorite_era_id,
    theme = excluded.theme,
    is_public = excluded.is_public;

  insert into public.community_profile_settings (user_id, share_favorites, share_history)
  values (owner_id, profile_share_favorites, profile_share_history)
  on conflict (user_id) do update set
    share_favorites = excluded.share_favorites,
    share_history = excluded.share_history;
end;
$$;

revoke all on function public.save_community_profile(text, text, text, uuid, uuid, uuid, text, boolean, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.save_community_profile(text, text, text, uuid, uuid, uuid, text, boolean, boolean, boolean)
  to authenticated;

commit;
