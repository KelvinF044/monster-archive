-- Run in homologation. All actors and content are rolled back.
begin;

insert into auth.users (id) values
  ('21304216-7d50-4936-ab22-98db575c1b01'),
  ('21304216-7d50-4936-ab22-98db575c1b02'),
  ('21304216-7d50-4936-ab22-98db575c1b03'),
  ('21304216-7d50-4936-ab22-98db575c1b04'),
  ('21304216-7d50-4936-ab22-98db575c1b05');

insert into public.community_moderators (user_id,is_active) values
  ('21304216-7d50-4936-ab22-98db575c1b03',true),
  ('21304216-7d50-4936-ab22-98db575c1b05',false);
insert into public.admin_users (user_id) values ('21304216-7d50-4936-ab22-98db575c1b04');

insert into public.community_profiles (user_id,handle,display_name,bio,is_public)
values ('21304216-7d50-4936-ab22-98db575c1b02','mod_check_256','Reported profile','Profile at submission',true);
insert into public.community_video_lists (id,user_id,title,is_public)
values
  ('21304216-7d50-4936-ab22-98db575c1c01','21304216-7d50-4936-ab22-98db575c1b02','Reported public list',true),
  ('21304216-7d50-4936-ab22-98db575c1c02','21304216-7d50-4936-ab22-98db575c1b02','Private list',false);

set local role anon;
do $$
begin
  if has_function_privilege(current_user,'public.submit_community_report(text,text,text,text)','EXECUTE')
    or has_function_privilege(current_user,'public.get_community_report_paths(uuid[])','EXECUTE')
    or has_column_privilege(current_user,'public.community_reports','id','SELECT') then
    raise exception 'Anonymous access to moderation';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub','21304216-7d50-4936-ab22-98db575c1b01',true);

do $$
begin
  if public.submit_community_report('profile','mod_check_256','harassment','Review the profile') <> 'sent'
    or public.submit_community_report('profile','mod_check_256','spam','Duplicate') <> 'duplicate'
    or public.submit_community_report('list','21304216-7d50-4936-ab22-98db575c1c01','spam','Review the list') <> 'sent'
    or public.submit_community_report('list','21304216-7d50-4936-ab22-98db575c1c02','spam','Private') <> 'unavailable'
    or exists (select id from public.community_reports)
    or exists (select id from public.community_report_actions) then
    raise exception 'Member reporting, duplicate guard or queue isolation failed';
  end if;

  begin
    perform public.decide_community_report(gen_random_uuid(),'resolve','Unauthorized');
    raise exception 'Member reached decision procedure';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub','21304216-7d50-4936-ab22-98db575c1b02',true);
do $$
begin
  if public.submit_community_report('profile','mod_check_256','other','Own profile') <> 'self' then
    raise exception 'Member reported own profile';
  end if;
  update public.community_profiles set handle='mod_renamed_256' where user_id=auth.uid();
end;
$$;

select set_config('request.jwt.claim.sub','21304216-7d50-4936-ab22-98db575c1b05',true);
do $$
begin
  if exists (select id from public.community_reports) then raise exception 'Inactive moderator can read the queue'; end if;
  begin
    perform public.decide_community_report(gen_random_uuid(),'resolve','Inactive');
    raise exception 'Inactive moderator can decide reports';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub','21304216-7d50-4936-ab22-98db575c1b03',true);
do $$
declare
  profile_report uuid;
  list_report uuid;
begin
  select id into strict profile_report from public.community_reports where title='Reported profile' and status='pending';
  select id into strict list_report from public.community_reports where title='Reported public list' and status='pending';
  if (select current_path from public.get_community_report_paths(array[profile_report])) <> '/u/mod_renamed_256' then
    raise exception 'Queue did not follow the original profile to its new URL';
  end if;
  if not public.decide_community_report(profile_report,'hide','Profile review')
    or not public.decide_community_report(list_report,'hide','List review')
    or public.decide_community_report(profile_report,'dismiss','Stale decision') then
    raise exception 'Moderator hide or duplicate decision guard failed';
  end if;
  if (select count(id) from public.community_report_actions
      where report_id in (profile_report,list_report) and actor_role='moderator' and decision='hide') <> 2 then
    raise exception 'Missing decision audit';
  end if;
  perform set_config('test.profile_report',profile_report::text,true);
  perform set_config('test.list_report',list_report::text,true);
end;
$$;

set local role anon;
do $$
begin
  if exists (select handle from public.community_profiles where handle='mod_renamed_256')
    or public.get_shared_community_video_list('21304216-7d50-4936-ab22-98db575c1c01') is not null then
    raise exception 'Moderated content remains public';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub','21304216-7d50-4936-ab22-98db575c1b02',true);
do $$
begin
  begin
    update public.community_profiles set is_public=true where user_id=auth.uid();
    raise exception 'Hidden profile can be republished';
  exception when check_violation then null;
  end;
  begin
    update public.community_video_lists set is_public=true where id='21304216-7d50-4936-ab22-98db575c1c01';
    raise exception 'Hidden list can be republished';
  exception when check_violation then null;
  end;
  begin
    update public.community_profiles set moderation_hidden=false;
    raise exception 'Owner can clear profile moderation flag';
  exception when insufficient_privilege then null;
  end;
  update public.community_video_lists set description='Edited privately' where id='21304216-7d50-4936-ab22-98db575c1c01';
end;
$$;

select set_config('request.jwt.claim.sub','21304216-7d50-4936-ab22-98db575c1b04',true);
do $$
declare
  profile_report uuid := current_setting('test.profile_report')::uuid;
  list_report uuid := current_setting('test.list_report')::uuid;
begin
  if not public.decide_community_report(profile_report,'restore','Profile reviewed')
    or not public.decide_community_report(list_report,'restore','List reviewed') then
    raise exception 'Administrator could not lift moderation';
  end if;
  if (select count(id) from public.community_report_actions
      where report_id in (profile_report,list_report) and actor_role='admin' and decision='restore') <> 2 then
    raise exception 'Second action missing from audit';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub','21304216-7d50-4936-ab22-98db575c1b02',true);
do $$
begin
  if exists (select user_id from public.community_profiles where user_id=auth.uid() and (is_public or moderation_hidden))
    or exists (select id from public.community_video_lists where user_id=auth.uid() and (is_public or moderation_hidden)) then
    raise exception 'Lifted restriction should leave the content private';
  end if;
  update public.community_profiles set is_public=true where user_id=auth.uid();
  update public.community_video_lists set is_public=true where id='21304216-7d50-4936-ab22-98db575c1c01';
end;
$$;

select 'PASS: moderator boundaries, reports, audit, hide and owner-controlled republication' as result;
rollback;
