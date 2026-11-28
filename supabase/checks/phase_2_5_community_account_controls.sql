-- Run against homologation. Only synthetic accounts, all rolled back.
begin;

insert into auth.users (id, created_at, email_confirmed_at) values
  ('eb12f023-b2e4-4d70-aa53-eed4af8a8981', now(), now()),
  ('eb12f023-b2e4-4d70-aa53-eed4af8a8982', now(), now()),
  ('eb12f023-b2e4-4d70-aa53-eed4af8a8983', now(), now()),
  ('eb12f023-b2e4-4d70-aa53-eed4af8a8984', now(), null),
  ('eb12f023-b2e4-4d70-aa53-eed4af8a8985', now(), now());
insert into public.admin_users (user_id) values ('eb12f023-b2e4-4d70-aa53-eed4af8a8981');
insert into public.community_moderators (user_id) values ('eb12f023-b2e4-4d70-aa53-eed4af8a8983');
insert into public.community_profiles (user_id, handle, display_name, is_public) values
  ('eb12f023-b2e4-4d70-aa53-eed4af8a8982', 'qa_account_82', 'Account QA member', true);
insert into public.community_video_lists (user_id, title)
values ('eb12f023-b2e4-4d70-aa53-eed4af8a8982', 'Account QA list');

set local role anon;
do $$
begin
  if has_function_privilege(current_user,'public.manage_admin_community_account(uuid,text,integer,text,text,text,timestamptz,text)','EXECUTE')
    or has_function_privilege(current_user,'public.get_admin_community_account_events(integer)','EXECUTE') then
    raise exception 'Anonymous role can access account controls';
  end if;
end;
$$;

set local role authenticated;
do $$
declare
  actor uuid;
begin
  foreach actor in array array[
    'eb12f023-b2e4-4d70-aa53-eed4af8a8982'::uuid,
    'eb12f023-b2e4-4d70-aa53-eed4af8a8983'::uuid
  ] loop
    perform set_config('request.jwt.claim.sub', actor::text, true);
    begin
      perform public.manage_admin_community_account('eb12f023-b2e4-4d70-aa53-eed4af8a8985','role',null,'', 'admin','member',null,null);
      raise exception 'Non-admin can grant a role';
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.get_admin_community_account_events(1);
      raise exception 'Non-admin can read the audit';
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

select set_config('request.jwt.claim.sub','eb12f023-b2e4-4d70-aa53-eed4af8a8981',true);
do $$
declare
  admin uuid := 'eb12f023-b2e4-4d70-aa53-eed4af8a8981';
  member_id uuid := 'eb12f023-b2e4-4d70-aa53-eed4af8a8982';
  unconfirmed uuid := 'eb12f023-b2e4-4d70-aa53-eed4af8a8984';
begin
  if public.manage_admin_community_account(admin,'role',null,'','member','admin',null,null) <> 'protected'
    or public.manage_admin_community_account(admin,'delete_account',null,'',null,'admin',null,admin::text) <> 'protected'
    or public.manage_admin_community_account(admin,'suspend',1,'Reason',null,'admin',null,null) <> 'protected'
    or public.manage_admin_community_account(unconfirmed,'role',null,'','moderator','member',null,null) <> 'ineligible'
    or public.manage_admin_community_account(member_id,'suspend',1,' ',null,'member',null,null) <> 'invalid'
    or public.manage_admin_community_account(member_id,'suspend',48,'Test suspension',null,'member',null,null) <> 'saved' then
    raise exception 'Protection, validation or suspension failed';
  end if;
  if not exists (
    select 1 from public.get_admin_community_account_events(1)
    where target_id=member_id and operation='suspend' and reason='Test suspension'
      and effective_until between now() + interval '47 hours' and now() + interval '49 hours'
  ) then raise exception 'Missing reason or expiry in the audit'; end if;
end;
$$;

-- The same signed-in account is rejected after the ban, even with an older token.
select set_config('request.jwt.claim.sub','eb12f023-b2e4-4d70-aa53-eed4af8a8982',true);
do $$
begin
  if public.community_account_enabled()
    or exists (select 1 from public.community_video_lists)
    or exists (select 1 from public.community_profiles)
    or public.record_community_watch_history(gen_random_uuid(),7,false,0)
    or public.change_community_list_item(gen_random_uuid(),gen_random_uuid(),'add')
    or public.submit_community_report('profile','qa_account_82','spam','') <> 'unavailable' then
    raise exception 'Suspended token can still use member endpoints';
  end if;
  begin
    insert into public.community_video_lists (user_id,title) values (auth.uid(),'Blocked');
    raise exception 'Suspended token can create a list';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.manage_community_watch_history('clear',null);
    raise exception 'Suspended token can write history preferences';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub','eb12f023-b2e4-4d70-aa53-eed4af8a8981',true);
do $$
declare
  member_id uuid := 'eb12f023-b2e4-4d70-aa53-eed4af8a8982';
  expiry timestamptz;
begin
  select suspended_until into expiry from public.get_admin_community_profiles('@qa_account_82','newest',1);
  if public.manage_admin_community_account(member_id,'revoke',null,'',null,'member',null,null) <> 'stale'
    or public.manage_admin_community_account(member_id,'role',null,'','moderator','member',expiry,null) <> 'ineligible'
    or public.manage_admin_community_account(member_id,'revoke',null,'Test revoke',null,'member',expiry,null) <> 'saved' then
    raise exception 'Revocation or stale suspension protection failed';
  end if;
  if public.manage_admin_community_account(member_id,'role',null,'','moderator','member',null,null) <> 'saved'
    or public.manage_admin_community_account(member_id,'role',null,'','admin','moderator',null,null) <> 'saved'
    or public.manage_admin_community_account(member_id,'delete_account',null,'',null,'admin',null,'@qa_account_82') <> 'protected'
    or public.manage_admin_community_account(member_id,'role',null,'','member','admin',null,null) <> 'saved'
    or public.manage_admin_community_account(member_id,'remove_profile',null,'',null,'member',null,'wrong') <> 'invalid'
    or public.manage_admin_community_account(member_id,'remove_profile',null,'',null,'member',null,'@qa_account_82') <> 'saved' then
    raise exception 'Role changes or profile removal failed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub','eb12f023-b2e4-4d70-aa53-eed4af8a8982',true);
do $$
begin
  if not public.community_account_enabled() or not exists(select 1 from public.community_video_lists)
    or exists(select 1 from public.community_profiles)
    or community_private.moderation_role() is not null then
    raise exception 'Removing profiles did not retain login and lists, or left staff privileges';
  end if;
end;
$$;

reset role;
update auth.users set banned_until = now() - interval '1 second'
where id='eb12f023-b2e4-4d70-aa53-eed4af8a8982';
set local role authenticated;
do $$
begin
  if not public.community_account_enabled() then raise exception 'Expired ban should permit login'; end if;
end;
$$;

select set_config('request.jwt.claim.sub','eb12f023-b2e4-4d70-aa53-eed4af8a8981',true);
do $$
declare
  member_id uuid := 'eb12f023-b2e4-4d70-aa53-eed4af8a8982';
begin
  if public.manage_admin_community_account(member_id,'delete_account',null,'',null,'member',null,'@qa_account_82') <> 'invalid'
    or public.manage_admin_community_account(member_id,'delete_account',null,'Test deletion',null,'member',null,member_id::text) <> 'saved' then
    raise exception 'Deletion confirmation or deletion failed';
  end if;
  if not exists (select 1 from public.get_admin_community_account_events(1) where target_id=member_id and operation='delete_account') then
    raise exception 'Missing retained audit after account deletion';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub','eb12f023-b2e4-4d70-aa53-eed4af8a8982',true);
do $$
begin
  if public.community_account_enabled() then raise exception 'Deleted account can still use its token'; end if;
end;
$$;
reset role;
do $$
begin
  if exists(select 1 from auth.users where id='eb12f023-b2e4-4d70-aa53-eed4af8a8982')
    or exists(select 1 from public.community_video_lists where user_id='eb12f023-b2e4-4d70-aa53-eed4af8a8982') then
    raise exception 'Permanent deletion did not remove Auth and related lists';
  end if;
end;
$$;

select 'PASS: admin gates, temporary bans, expiry, revoke, roles, audit, profile removal and permanent account deletion' as result;
rollback;
