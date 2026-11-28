begin;

create table public.community_history_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  paused boolean not null default false,
  recording_version integer not null default 0 check (recording_version >= 0)
);

create table public.community_watch_history (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid not null references public.watch_videos (id) on delete cascade,
  position_seconds integer not null check (position_seconds between 0 and 604800),
  completed boolean not null default false,
  last_watched_at timestamptz not null default clock_timestamp(),
  primary key (user_id, video_id)
);

create index community_history_recent_idx on public.community_watch_history (user_id, last_watched_at desc, video_id);
create index community_history_video_idx on public.community_watch_history (video_id);

alter table public.community_history_preferences enable row level security;
alter table public.community_watch_history enable row level security;

revoke all on public.community_history_preferences, public.community_watch_history from public, anon, authenticated;
grant select on public.community_history_preferences, public.community_watch_history to authenticated;

create policy "Members read their history preferences"
  on public.community_history_preferences for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Members read their own history"
  on public.community_watch_history for select to authenticated
  using (user_id = (select auth.uid()));

create view public.community_history_cards with (security_invoker = true) as
select h.user_id, h.video_id, h.position_seconds, h.completed, h.last_watched_at, v.slug as video_slug,
       v.title, v.youtube_video_id, v.thumbnail_url, v.thumbnail_alt, collection.slug as collection_slug
from public.community_watch_history h
join public.watch_videos v on v.id = h.video_id and v.status = 'published'
join lateral (
  select c.slug
  from public.watch_video_collections vc
  join public.watch_collections c on c.id = vc.collection_id
  where vc.video_id = v.id and c.is_active
  order by c.display_order, c.slug
  limit 1
) collection on true;

revoke all on public.community_history_cards from public, anon, authenticated;
grant select on public.community_history_cards to authenticated;

create function community_private.record_watch_history(
  watched_video uuid, position_seconds integer, playback_completed boolean, expected_version integer
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  pref public.community_history_preferences%rowtype;
begin
  if owner_id is null or position_seconds is null or position_seconds not between 0 and 604800
    or playback_completed is null or expected_version is null or expected_version < 0 then
    return false;
  end if;

  insert into public.community_history_preferences (user_id) values (owner_id) on conflict do nothing;
  select * into strict pref from public.community_history_preferences
   where user_id = owner_id for update;

  if pref.paused or pref.recording_version <> expected_version or not exists (
    select 1 from public.watch_videos v
    join public.watch_video_collections vc on vc.video_id = v.id
    join public.watch_collections c on c.id = vc.collection_id
    where v.id = watched_video and v.status = 'published' and c.is_active
  ) then
    return false;
  end if;

  insert into public.community_watch_history (user_id, video_id, position_seconds, completed)
  values (owner_id, watched_video, position_seconds, playback_completed)
  on conflict (user_id, video_id) do update set
    position_seconds = excluded.position_seconds,
    completed = excluded.completed,
    last_watched_at = excluded.last_watched_at;
  return true;
end;
$$;

create function public.record_community_watch_history(
  watched_video uuid, position_seconds integer, playback_completed boolean, expected_version integer
) returns boolean
language sql security invoker set search_path = ''
as $$
  select community_private.record_watch_history(watched_video, position_seconds, playback_completed, expected_version);
$$;

create function community_private.manage_watch_history(history_action text, watched_video uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise insufficient_privilege;
  end if;
  if history_action is null or history_action not in ('pause', 'resume', 'clear', 'remove')
    or (history_action = 'remove' and watched_video is null) then
    raise invalid_parameter_value;
  end if;

  -- Invalidate pending writes from open players before removing data or changing capture.
  insert into public.community_history_preferences as p (user_id, paused, recording_version)
  values (owner_id, history_action = 'pause', 1)
  on conflict (user_id) do update set
    paused = case when history_action in ('pause', 'resume') then excluded.paused else p.paused end,
    recording_version = p.recording_version + 1;

  if history_action = 'clear' then
    delete from public.community_watch_history where user_id = owner_id;
  elsif history_action = 'remove' then
    delete from public.community_watch_history where user_id = owner_id and video_id = watched_video;
  end if;
end;
$$;

create function public.manage_community_watch_history(history_action text, watched_video uuid)
returns void
language sql security invoker set search_path = ''
as $$
  select community_private.manage_watch_history(history_action, watched_video);
$$;

create function community_private.shared_watch_history(profile_handle text)
returns table (
  video_id uuid, video_slug text, title text, youtube_video_id text, thumbnail_url text,
  thumbnail_alt text, collection_slug text
)
language sql stable security definer set search_path = ''
as $$
  select h.video_id, h.video_slug, h.title, h.youtube_video_id, h.thumbnail_url, h.thumbnail_alt, h.collection_slug
  from public.community_profiles p
  join public.community_profile_settings s on s.user_id = p.user_id and s.share_history
  join public.community_history_cards h on h.user_id = p.user_id
  where p.handle = profile_handle and p.is_public
  order by h.last_watched_at desc, h.video_id
  limit 24;
$$;

create function public.get_shared_community_watch_history(profile_handle text)
returns table (
  video_id uuid, video_slug text, title text, youtube_video_id text, thumbnail_url text,
  thumbnail_alt text, collection_slug text
)
language sql stable security invoker set search_path = ''
as $$
  select * from community_private.shared_watch_history(profile_handle);
$$;

revoke all on function community_private.record_watch_history(uuid, integer, boolean, integer),
  public.record_community_watch_history(uuid, integer, boolean, integer),
  community_private.manage_watch_history(text, uuid), public.manage_community_watch_history(text, uuid),
  community_private.shared_watch_history(text), public.get_shared_community_watch_history(text)
  from public, anon, authenticated;

grant execute on function community_private.record_watch_history(uuid, integer, boolean, integer),
  public.record_community_watch_history(uuid, integer, boolean, integer),
  community_private.manage_watch_history(text, uuid), public.manage_community_watch_history(text, uuid)
  to authenticated;
grant execute on function community_private.shared_watch_history(text), public.get_shared_community_watch_history(text)
  to anon, authenticated;

commit;
