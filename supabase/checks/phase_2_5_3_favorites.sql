-- Run only in homologation. Fixtures and catalog changes are rolled back.
begin;

insert into auth.users (id) values
  ('7ccab451-f6cb-4e1a-8c09-6b1e12038fb1'),
  ('7ccab451-f6cb-4e1a-8c09-6b1e12038fb2');

do $$
declare
  selected_video uuid;
begin
  insert into public.watch_videos (slug, title, youtube_video_id, source_name, source_url, status)
  values ('favorite-qa-253', 'Favorite QA', 'QaFav253x01', 'QA', 'https://www.youtube.com/watch?v=QaFav253x01', 'published')
  returning id into selected_video;
  insert into public.watch_video_collections (video_id, collection_id)
  select selected_video, id from public.watch_collections
  where is_active order by display_order, slug limit 1;
  perform set_config('test.favorite_video', selected_video::text, true);
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '7ccab451-f6cb-4e1a-8c09-6b1e12038fb1', true);
select public.save_community_profile('favorite_qa_253', 'Favorite test', '', null, null, null, 'violet', true, false, false);

insert into public.community_favorites (user_id, video_id)
select auth.uid(), current_setting('test.favorite_video')::uuid
on conflict (user_id, video_id) do nothing;
insert into public.community_favorites (user_id, video_id)
select auth.uid(), current_setting('test.favorite_video')::uuid
on conflict (user_id, video_id) do nothing;

do $$
begin
  if (select count(*) from public.community_favorite_cards) <> 1 then
    raise exception 'Favorite did not appear exactly once';
  end if;
  begin
    insert into public.community_favorites (user_id, video_id)
    values ('7ccab451-f6cb-4e1a-8c09-6b1e12038fb2', current_setting('test.favorite_video')::uuid);
    raise exception 'Favorite inserted into a different account';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role anon;
do $$
begin
  if exists (select 1 from public.get_shared_community_favorites('favorite_qa_253')) then
    raise exception 'Favorites shared without consent';
  end if;
  if has_table_privilege(current_user, 'public.community_favorites', 'select') then
    raise exception 'Direct anonymous favorites access';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '7ccab451-f6cb-4e1a-8c09-6b1e12038fb2', true);
do $$
begin
  if exists (select 1 from public.community_favorite_cards) then
    raise exception 'A member can read a different member''s library';
  end if;
  delete from public.community_favorites where video_id = current_setting('test.favorite_video')::uuid;
  if found then raise exception 'A member can remove a different member''s favorite'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '7ccab451-f6cb-4e1a-8c09-6b1e12038fb1', true);
select public.save_community_profile('favorite_qa_253', 'Favorite test', '', null, null, null, 'violet', true, true, false);
set local role anon;
do $$
begin
  if (select count(*) from public.get_shared_community_favorites('favorite_qa_253')) <> 1 then
    raise exception 'Opted-in favorite missing';
  end if;
end;
$$;

set local role authenticated;
select public.save_community_profile('favorite_qa_253', 'Favorite test', '', null, null, null, 'violet', false, true, false);
set local role anon;
do $$
begin
  if exists (select 1 from public.get_shared_community_favorites('favorite_qa_253')) then
    raise exception 'Favorite from a hidden profile is exposed';
  end if;
end;
$$;

set local role authenticated;
select public.save_community_profile('favorite_qa_253', 'Favorite test', '', null, null, null, 'violet', true, true, false);
reset role;
update public.watch_videos set status = 'draft' where id = current_setting('test.favorite_video')::uuid;

set local role anon;
do $$
begin
  if exists (select 1 from public.get_shared_community_favorites('favorite_qa_253')) then
    raise exception 'Draft video exposed in shared favorites';
  end if;
end;
$$;

set local role authenticated;
do $$
begin
  if exists (select 1 from public.community_favorite_cards) then
    raise exception 'Draft video listed in library';
  end if;
  delete from public.community_favorites where video_id = current_setting('test.favorite_video')::uuid;
  if not found then raise exception 'Owner cannot remove their favorite'; end if;
  begin
    insert into public.community_favorites (user_id, video_id)
    values (auth.uid(), current_setting('test.favorite_video')::uuid);
    raise exception 'Draft video can be favorited';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
select 'PASS: deduplication, favorites ownership, opt-in, profile visibility and drafts' as result;
rollback;
