-- Run in homologation. Test rows are rolled back.
begin;

insert into auth.users (id) values
  ('1a79ac2c-194e-42b1-8f15-99db21ade801'),
  ('1a79ac2c-194e-42b1-8f15-99db21ade802');

do $$
declare
  first_video uuid;
  second_video uuid;
  collection uuid;
begin
  select id into strict collection from public.watch_collections where is_active order by display_order,slug limit 1;
  insert into public.watch_videos (slug, title, youtube_video_id, source_name, source_url, status)
  values ('list-qa-one-255','First list test video','QaLis255x01','QA','https://www.youtube.com/watch?v=QaLis255x01','published')
  returning id into first_video;
  insert into public.watch_videos (slug, title, youtube_video_id, source_name, source_url, status)
  values ('list-qa-two-255','Second list test video','QaLis255x02','QA','https://www.youtube.com/watch?v=QaLis255x02','published')
  returning id into second_video;
  insert into public.watch_video_collections (video_id,collection_id)
  values (first_video,collection),(second_video,collection);
  perform set_config('test.list_first',first_video::text,true);
  perform set_config('test.list_second',second_video::text,true);
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub','1a79ac2c-194e-42b1-8f15-99db21ade801',true);
with saved as (
  insert into public.community_video_lists (user_id,title,description)
  values (auth.uid(),'Lists QA','Private by default') returning id
) select set_config('test.owned_list',id::text,true) from saved;

do $$
declare
  l uuid := current_setting('test.owned_list')::uuid;
  v1 uuid := current_setting('test.list_first')::uuid;
  v2 uuid := current_setting('test.list_second')::uuid;
begin
  if not exists (select 1 from public.community_video_lists where id=l and not is_public) then
    raise exception 'New list is not private';
  end if;
  if not public.change_community_list_item(l,v1,'add') then raise exception 'First add failed'; end if;
  if public.change_community_list_item(l,v1,'add') then raise exception 'Duplicate inserted'; end if;
  if not public.change_community_list_item(l,v2,'add') then raise exception 'Second add failed'; end if;
  if not public.change_community_list_item(l,v2,'up') then raise exception 'Move failed'; end if;
  if (select video_id from public.community_list_video_cards where list_id=l order by position limit 1) <> v2 then
    raise exception 'List items are in the wrong order';
  end if;
end;
$$;

set local role anon;
do $$
begin
  if public.get_shared_community_video_list(current_setting('test.owned_list')::uuid) is not null
    or has_table_privilege(current_user,'public.community_list_items','SELECT') then
    raise exception 'Private list exposed';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub','1a79ac2c-194e-42b1-8f15-99db21ade802',true);
do $$
declare l uuid := current_setting('test.owned_list')::uuid;
begin
  if exists (select 1 from public.community_video_lists where id=l)
     or exists (select 1 from public.community_list_video_cards where list_id=l) then
    raise exception 'Another member can read this list';
  end if;
  update public.community_video_lists set title='Unauthorised' where id=l;
  if found then raise exception 'Another member can edit list metadata'; end if;
  begin
    perform public.change_community_list_item(l,current_setting('test.list_first')::uuid,'remove');
    raise exception 'Another member can remove list items';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub','1a79ac2c-194e-42b1-8f15-99db21ade801',true);
update public.community_video_lists set is_public=true where id=current_setting('test.owned_list')::uuid;

set local role anon;
do $$
declare j jsonb := public.get_shared_community_video_list(current_setting('test.owned_list')::uuid);
begin
  if j is null or j->>'title' <> 'Lists QA' or jsonb_array_length(j->'videos') <> 2
     or j->'videos'->0->>'video_id' <> current_setting('test.list_second') or j ? 'user_id' then
    raise exception 'Shared list is missing, out of order, or exposes owner data';
  end if;
end;
$$;

reset role;
update public.watch_videos set status='draft' where id=current_setting('test.list_second')::uuid;

set local role anon;
do $$
declare j jsonb := public.get_shared_community_video_list(current_setting('test.owned_list')::uuid);
begin
  if jsonb_array_length(j->'videos') <> 1 or j->'videos'->0->>'video_id' <> current_setting('test.list_first') then
    raise exception 'A draft video appears in a public list';
  end if;
end;
$$;

set local role authenticated;
do $$
declare l uuid := current_setting('test.owned_list')::uuid;
begin
  if not exists (select 1 from public.community_list_video_cards where list_id=l and video_id=current_setting('test.list_second')::uuid and title is null) then
    raise exception 'Draft metadata leaked or owner cannot remove unavailable item';
  end if;
  if not public.change_community_list_item(l,current_setting('test.list_second')::uuid,'remove') then
    raise exception 'Owner could not remove a draft item';
  end if;
  begin
    perform public.change_community_list_item(l,current_setting('test.list_second')::uuid,'add');
    raise exception 'A draft can be added';
  exception when invalid_parameter_value then null;
  end;
  update public.community_video_lists set is_public=false where id=l;
  if public.get_shared_community_video_list(l) is not null then raise exception 'Access persisted after revoking the link'; end if;
  delete from public.community_video_lists where id=l;
end;
$$;

reset role;
do $$
begin
  if exists (select 1 from public.community_list_items where list_id=current_setting('test.owned_list')::uuid) then
    raise exception 'Deleting a list did not clear its membership';
  end if;
end;
$$;

select 'PASS: default privacy, ownership, duplicates, order, publication, draft filtering and deletion' as result;
rollback;
