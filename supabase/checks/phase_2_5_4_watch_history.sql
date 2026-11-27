-- In homologation only. The test fixture is rolled back.
begin;

insert into auth.users (id) values
  ('b225bbc3-37aa-46bf-8227-709488f14d01'),
  ('b225bbc3-37aa-46bf-8227-709488f14d02');

do $$
declare
  id_to_watch uuid;
begin
  insert into public.watch_videos (slug,title,youtube_video_id,source_name,source_url,status)
  values ('watch-history-qa-254','Watch history QA','QaHis254x01','QA','https://www.youtube.com/watch?v=QaHis254x01','published')
  returning id into id_to_watch;
  insert into public.watch_video_collections (video_id,collection_id)
  select id_to_watch,id from public.watch_collections where is_active order by display_order,slug limit 1;
  perform set_config('test.history_video', id_to_watch::text, true);
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub','b225bbc3-37aa-46bf-8227-709488f14d01',true);
select public.save_community_profile('history_qa_254','History QA','',null,null,null,'violet',true,false,false);

do $$
declare
  v uuid := current_setting('test.history_video')::uuid;
begin
  if not public.record_community_watch_history(v, 0, false, 0) then
    raise exception 'Starting playback was not recorded';
  end if;
  if not public.record_community_watch_history(v, 48, false, 0) then
    raise exception 'Progress update was not accepted';
  end if;
  if not exists (select 1 from public.community_history_cards where position_seconds=48 and not completed)
    or (select count(*) from public.community_history_cards) <> 1 then
    raise exception 'Progress data was not saved exactly once';
  end if;
  perform public.manage_community_watch_history('pause',null);
  if public.record_community_watch_history(v, 50, true, 0)
    or public.record_community_watch_history(v, 50, true, 1) then
    raise exception 'A paused or stale session recorded history';
  end if;
  perform public.manage_community_watch_history('resume',null);
  if public.record_community_watch_history(v, 50, true, 1) then
    raise exception 'A stale session recorded after resume';
  end if;
  if not public.record_community_watch_history(v, 50, true, 2) then
    raise exception 'Completion event was not accepted';
  end if;
  if not exists (select 1 from public.community_history_cards where completed) then
    raise exception 'Resume or completion tracking failed';
  end if;
end;
$$;

set local role anon;
do $$
begin
  if exists (select 1 from public.get_shared_community_watch_history('history_qa_254'))
    or has_table_privilege(current_user,'public.community_watch_history','SELECT') then
    raise exception 'History was exposed without consent';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub','b225bbc3-37aa-46bf-8227-709488f14d02',true);
select public.manage_community_watch_history('clear',null);
do $$
begin
  if exists (select 1 from public.community_history_cards) then
    raise exception 'A different member can read history';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub','b225bbc3-37aa-46bf-8227-709488f14d01',true);
select public.save_community_profile('history_qa_254','History QA','',null,null,null,'violet',true,false,true);
set local role anon;
do $$
begin
  if (select count(*) from public.get_shared_community_watch_history('history_qa_254')) <> 1
    or exists (select 1 from public.get_shared_community_watch_history('history_qa_254') x
               where to_jsonb(x) ?| array['position_seconds','completed','last_watched_at','user_id']) then
    raise exception 'Shared history is missing or exposes private progress';
  end if;
end;
$$;

set local role authenticated;
select public.save_community_profile('history_qa_254','History QA','',null,null,null,'violet',false,false,true);
set local role anon;
do $$
begin
  if exists (select 1 from public.get_shared_community_watch_history('history_qa_254')) then
    raise exception 'A private profile exposes history';
  end if;
end;
$$;

set local role authenticated;
do $$
declare
  v uuid := current_setting('test.history_video')::uuid;
begin
  perform public.manage_community_watch_history('remove', v);
  if exists (select 1 from public.community_watch_history)
    or public.record_community_watch_history(v, 53, false, 2)
    or not public.record_community_watch_history(v, 8, false, 3) then
    raise exception 'Removal or stale progress rejection failed';
  end if;
  perform public.manage_community_watch_history('clear',null);
  if exists (select 1 from public.community_watch_history)
    or public.record_community_watch_history(v, 12, false, 3) then
    raise exception 'Clear did not invalidate old playback';
  end if;
end;
$$;

reset role;
select 'PASS: playback progress, pause, resume, role isolation, sharing, removal and clear' as result;
rollback;
