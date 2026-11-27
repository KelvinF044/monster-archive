begin;

create table public.community_video_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index community_video_lists_owner_idx on public.community_video_lists (user_id, created_at desc, id);

create table public.community_list_items (
  list_id uuid not null references public.community_video_lists (id) on delete cascade,
  video_id uuid not null references public.watch_videos (id) on delete cascade,
  position integer not null check (position > 0),
  primary key (list_id, video_id),
  unique (list_id, position) deferrable initially immediate
);

create index community_list_items_video_idx on public.community_list_items (video_id);

alter table public.community_video_lists enable row level security;
alter table public.community_list_items enable row level security;
revoke all on public.community_video_lists, public.community_list_items from public, anon, authenticated;
grant select, delete on public.community_video_lists to authenticated;
grant insert (user_id, title, description), update (title, description, is_public)
  on public.community_video_lists to authenticated;
grant select on public.community_list_items to authenticated;

create policy "Members read their lists" on public.community_video_lists for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Members create private lists" on public.community_video_lists for insert to authenticated
  with check (user_id = (select auth.uid()) and not is_public);
create policy "Members edit their lists" on public.community_video_lists for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Members delete their lists" on public.community_video_lists for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "Members read items in their lists" on public.community_list_items for select to authenticated
  using (
    exists (select 1 from public.community_video_lists l
            where l.id = list_id and l.user_id = (select auth.uid()))
  );

create view public.community_list_video_cards with (security_invoker = true) as
select i.list_id, i.video_id, i.position,
       case when collection.slug is not null then v.slug end as video_slug,
       case when collection.slug is not null then v.title end as title,
       case when collection.slug is not null then v.youtube_video_id end as youtube_video_id,
       case when collection.slug is not null then v.thumbnail_url end as thumbnail_url,
       case when collection.slug is not null then v.thumbnail_alt end as thumbnail_alt,
       collection.slug as collection_slug
from public.community_list_items i
left join public.watch_videos v on v.id = i.video_id and v.status = 'published'
left join lateral (
  select c.slug
  from public.watch_video_collections vc
  join public.watch_collections c on c.id = vc.collection_id
  where vc.video_id = v.id and c.is_active
  order by c.display_order, c.slug
  limit 1
) collection on true;

revoke all on public.community_list_video_cards from public, anon, authenticated;
grant select on public.community_list_video_cards to authenticated;

create function community_private.change_list_item(target_list uuid, target_video uuid, operation text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  current_position integer;
  neighbor_position integer;
begin
  if owner_id is null or operation is null or operation not in ('add','remove','up','down') then
    raise insufficient_privilege;
  end if;

  -- Serialize changes to this list, including concurrent additions and position swaps.
  perform 1 from public.community_video_lists
    where id = target_list and user_id = owner_id for update;
  if not found then raise insufficient_privilege; end if;

  if operation = 'add' then
    if exists (select 1 from public.community_list_items where list_id = target_list and video_id = target_video) then
      return false;
    end if;
    if not exists (
      select 1 from public.watch_videos v
      join public.watch_video_collections vc on vc.video_id = v.id
      join public.watch_collections c on c.id = vc.collection_id
      where v.id = target_video and v.status = 'published' and c.is_active
    ) then
      raise invalid_parameter_value;
    end if;

    insert into public.community_list_items (list_id,video_id,position)
    select target_list,target_video,coalesce(max(position),0)+1
    from public.community_list_items where list_id = target_list;
    return true;
  end if;

  if operation = 'remove' then
    delete from public.community_list_items where list_id = target_list and video_id = target_video;
    return found;
  end if;

  select position into current_position from public.community_list_items
    where list_id = target_list and video_id = target_video;
  if current_position is null then return false; end if;

  if operation = 'up' then
    select max(position) into neighbor_position from public.community_list_items
      where list_id = target_list and position < current_position;
  else
    select min(position) into neighbor_position from public.community_list_items
      where list_id = target_list and position > current_position;
  end if;

  if neighbor_position is null then return false; end if;
  update public.community_list_items
    set position = case when position = current_position then neighbor_position else current_position end
    where list_id = target_list and position in (current_position, neighbor_position);
  return true;
end;
$$;

create function public.change_community_list_item(target_list uuid, target_video uuid, operation text)
returns boolean
language sql security invoker set search_path = ''
as $$
  select community_private.change_list_item(target_list, target_video, operation);
$$;

create function community_private.get_shared_video_list(target_list uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'title', l.title,
    'description', l.description,
    'videos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'video_id', c.video_id,
        'video_slug', c.video_slug,
        'title', c.title,
        'youtube_video_id', c.youtube_video_id,
        'thumbnail_url', c.thumbnail_url,
        'thumbnail_alt', c.thumbnail_alt,
        'collection_slug', c.collection_slug
      ) order by c.position)
      from public.community_list_video_cards c
      where c.list_id = l.id and c.collection_slug is not null
    ), '[]'::jsonb)
  )
  from public.community_video_lists l where l.id = target_list and l.is_public;
$$;

create function public.get_shared_community_video_list(target_list uuid)
returns jsonb
language sql stable security invoker set search_path = ''
as $$
  select community_private.get_shared_video_list(target_list);
$$;

revoke all on function community_private.change_list_item(uuid,uuid,text), public.change_community_list_item(uuid,uuid,text),
  community_private.get_shared_video_list(uuid), public.get_shared_community_video_list(uuid)
  from public, anon, authenticated;
grant execute on function community_private.change_list_item(uuid,uuid,text), public.change_community_list_item(uuid,uuid,text)
  to authenticated;
grant execute on function community_private.get_shared_video_list(uuid), public.get_shared_community_video_list(uuid)
  to anon, authenticated;

commit;
