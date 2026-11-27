begin;

create table public.community_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid not null references public.watch_videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index community_favorites_video_id_idx on public.community_favorites (video_id);
create index community_favorites_user_created_idx on public.community_favorites (user_id, created_at desc, video_id);

alter table public.community_favorites enable row level security;
revoke all on public.community_favorites from public, anon, authenticated;
grant select, delete on public.community_favorites to authenticated;
grant insert (user_id, video_id) on public.community_favorites to authenticated;

create policy "Members read their favorites"
  on public.community_favorites for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Members save published videos"
  on public.community_favorites for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.watch_videos v
      join public.watch_video_collections vc on vc.video_id = v.id
      join public.watch_collections c on c.id = vc.collection_id
      where v.id = community_favorites.video_id and v.status = 'published' and c.is_active
    )
  );

create policy "Members remove their favorites"
  on public.community_favorites for delete to authenticated
  using (user_id = (select auth.uid()));

create view public.community_favorite_cards with (security_invoker = true) as
select f.user_id, f.video_id, f.created_at, v.slug as video_slug, v.title,
       v.youtube_video_id, v.thumbnail_url, v.thumbnail_alt, collection.slug as collection_slug
from public.community_favorites f
join public.watch_videos v on v.id = f.video_id and v.status = 'published'
join lateral (
  select c.slug
  from public.watch_video_collections vc
  join public.watch_collections c on c.id = vc.collection_id
  where vc.video_id = v.id and c.is_active
  order by c.display_order, c.slug
  limit 1
) collection on true;

revoke all on public.community_favorite_cards from public, anon, authenticated;
grant select on public.community_favorite_cards to authenticated;

create schema if not exists community_private;
revoke all on schema community_private from public, anon, authenticated;
grant usage on schema community_private to anon, authenticated;

-- Only the public fields of published videos are returned, after checking both consent flags.
create function community_private.shared_favorite_cards(profile_handle text)
returns table (
  video_id uuid, video_slug text, title text, youtube_video_id text, thumbnail_url text,
  thumbnail_alt text, collection_slug text
)
language sql stable security definer set search_path = ''
as $$
  select f.video_id, f.video_slug, f.title, f.youtube_video_id,
         f.thumbnail_url, f.thumbnail_alt, f.collection_slug
  from public.community_profiles p
  join public.community_profile_settings s on s.user_id = p.user_id and s.share_favorites
  join public.community_favorite_cards f on f.user_id = p.user_id
  where p.handle = profile_handle and p.is_public
  order by f.created_at desc, f.video_id
  limit 24;
$$;

revoke all on function community_private.shared_favorite_cards(text) from public, anon, authenticated;
grant execute on function community_private.shared_favorite_cards(text) to anon, authenticated;

create function public.get_shared_community_favorites(profile_handle text)
returns table (
  video_id uuid, video_slug text, title text, youtube_video_id text, thumbnail_url text,
  thumbnail_alt text, collection_slug text
)
language sql stable security invoker set search_path = ''
as $$
  select * from community_private.shared_favorite_cards(profile_handle);
$$;

revoke all on function public.get_shared_community_favorites(text) from public, anon, authenticated;
grant execute on function public.get_shared_community_favorites(text) to anon, authenticated;

commit;
