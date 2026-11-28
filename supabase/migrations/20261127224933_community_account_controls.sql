begin;

create function community_private.account_enabled()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= statement_timestamp())
  );
$$;

create function public.community_account_enabled()
returns boolean
language sql stable security invoker set search_path = ''
as $$
  select community_private.account_enabled();
$$;

revoke all on function community_private.account_enabled(), public.community_account_enabled() from public, anon, authenticated;
grant execute on function community_private.account_enabled(), public.community_account_enabled() to authenticated;

-- A previously issued JWT must not bypass the current account state.
do $$
declare
  relation text;
begin
  foreach relation in array array[
    'admin_users', 'community_moderators', 'community_profiles', 'community_profile_settings',
    'community_favorites', 'community_history_preferences', 'community_watch_history',
    'community_video_lists', 'community_list_items', 'community_reports', 'community_report_actions'
  ] loop
    execute format(
      'create policy "Require active community account" on public.%I as restrictive for all
       to authenticated using ((select community_private.account_enabled()))
       with check ((select community_private.account_enabled()))', relation);
  end loop;
end;
$$;

create or replace function community_private.moderation_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select case
    when not community_private.account_enabled() then null
    when exists (select 1 from public.admin_users where user_id = auth.uid() and is_active) then 'admin'
    when exists (select 1 from public.community_moderators where user_id = auth.uid() and is_active) then 'moderator'
  end;
$$;

-- These invoker endpoints call internal functions that write across RLS.
create or replace function public.record_community_watch_history(
  watched_video uuid, position_seconds integer, playback_completed boolean, expected_version integer
) returns boolean
language sql security invoker set search_path = ''
as $$
  select case when community_private.account_enabled()
    then community_private.record_watch_history(watched_video, position_seconds, playback_completed, expected_version)
    else false end;
$$;

create or replace function public.manage_community_watch_history(history_action text, watched_video uuid)
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not community_private.account_enabled() then raise insufficient_privilege; end if;
  perform community_private.manage_watch_history(history_action, watched_video);
end;
$$;

create or replace function public.change_community_list_item(target_list uuid, target_video uuid, operation text)
returns boolean
language sql security invoker set search_path = ''
as $$
  select case when community_private.account_enabled()
    then community_private.change_list_item(target_list, target_video, operation)
    else false end;
$$;

create or replace function public.submit_community_report(kind text, target text, category text, context text)
returns text
language sql security invoker set search_path = ''
as $$
  select case when community_private.account_enabled() then community_private.submit_report(kind, target, category, context)
    else 'unavailable' end;
$$;

create table community_private.account_admin_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  target_id uuid not null,
  target_handle text,
  operation text not null check (operation in ('suspend', 'revoke', 'role', 'remove_profile', 'delete_account')),
  reason text not null default '' check (char_length(reason) <= 400),
  previous_role text not null,
  new_role text,
  effective_until timestamptz,
  created_at timestamptz not null default clock_timestamp()
);

create index account_admin_events_recent on community_private.account_admin_events (created_at desc, id desc);
alter table community_private.account_admin_events enable row level security;
revoke all on community_private.account_admin_events from public, anon, authenticated;

create function community_private.manage_account_as_admin(
  target_account uuid, operation text, duration_hours integer, reason text,
  new_role text, expected_role text, expected_until timestamptz, confirmation text
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  selected auth.users%rowtype;
  target_handle text;
  target_role text;
  current_until timestamptz;
  new_until timestamptz;
begin
  if community_private.moderation_role() is distinct from 'admin' then raise insufficient_privilege; end if;

  -- Serialize account controls and recheck the actor's role after waiting.
  perform pg_catalog.pg_advisory_xact_lock(789438, 59254);
  if community_private.moderation_role() is distinct from 'admin' then raise insufficient_privilege; end if;
  if target_account = auth.uid() then return 'protected'; end if;
  if target_account is null or operation is null
    or operation not in ('suspend', 'revoke', 'role', 'remove_profile', 'delete_account')
    or reason is null or char_length(btrim(reason)) > 400
    or expected_role is null or expected_role not in ('member', 'moderator', 'admin') then
    return 'invalid';
  end if;

  select u.* into selected from auth.users u
    where u.id = target_account and u.deleted_at is null and not coalesce(u.is_anonymous,false)
    for update;
  if not found then return 'unavailable'; end if;

  target_role := case
    when exists (select 1 from public.admin_users where user_id = target_account and is_active) then 'admin'
    when exists (select 1 from public.community_moderators where user_id = target_account and is_active) then 'moderator'
    else 'member'
  end;
  current_until := case when selected.banned_until > statement_timestamp() then selected.banned_until end;
  if target_role is distinct from expected_role or current_until is distinct from expected_until then return 'stale'; end if;

  select p.handle into target_handle from public.community_profiles p where p.user_id = target_account for update;
  if operation in ('suspend', 'delete_account') and target_role = 'admin' then return 'protected'; end if;

  case operation
    when 'suspend' then
      if duration_hours is null or duration_hours not between 1 and 8760 or btrim(reason) = '' then return 'invalid'; end if;
      if current_until is not null then return 'stale'; end if;
      new_until := clock_timestamp() + make_interval(hours => duration_hours);
      update auth.users set banned_until = new_until, updated_at = clock_timestamp() where id = target_account;

    when 'revoke' then
      if current_until is null then return 'unchanged'; end if;
      update auth.users set banned_until = null, updated_at = clock_timestamp() where id = target_account;

    when 'role' then
      if new_role is null or new_role not in ('member', 'moderator', 'admin') then return 'invalid'; end if;
      if new_role = target_role then return 'unchanged'; end if;
      if new_role <> 'member' and (selected.email_confirmed_at is null or current_until is not null) then return 'ineligible'; end if;
      if target_role = 'admin' and not exists (
        select 1 from public.admin_users a join auth.users u on u.id = a.user_id
        where a.is_active and a.user_id <> target_account and u.deleted_at is null
          and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until <= statement_timestamp())
      ) then return 'protected'; end if;

      if new_role = 'admin' then
        insert into public.admin_users (user_id, is_active) values (target_account, true)
        on conflict (user_id) do update set is_active = true;
      else
        update public.admin_users set is_active = false where user_id = target_account and is_active;
      end if;

      if new_role = 'moderator' then
        insert into public.community_moderators (user_id, is_active) values (target_account, true)
        on conflict (user_id) do update set is_active = true;
      else
        update public.community_moderators set is_active = false where user_id = target_account and is_active;
      end if;

    when 'remove_profile' then
      if target_handle is null then return 'unchanged'; end if;
      if btrim(confirmation) is distinct from '@' || target_handle then return 'invalid'; end if;
      delete from public.community_profiles where user_id = target_account;

    when 'delete_account' then
      if btrim(confirmation) is distinct from coalesce('@' || target_handle, target_account::text) then return 'invalid'; end if;
      -- Storage ownership needs to be resolved before deleting an Auth user.
      if exists (select 1 from storage.objects o where o.owner_id = target_account::text or o.owner = target_account) then
        return 'owns_files';
      end if;
      delete from auth.users where id = target_account;
  end case;

  insert into community_private.account_admin_events
    (actor_id, target_id, target_handle, operation, reason, previous_role, new_role, effective_until)
  values (auth.uid(), target_account, target_handle, operation, btrim(reason), target_role,
    case when operation = 'role' then new_role end, new_until);
  return 'saved';
end;
$$;

create function public.manage_admin_community_account(
  target_account uuid, operation text, duration_hours integer, reason text,
  new_role text, expected_role text, expected_until timestamptz, confirmation text
) returns text
language sql security invoker set search_path = ''
as $$
  select community_private.manage_account_as_admin(
    target_account, operation, duration_hours, reason, new_role, expected_role, expected_until, confirmation);
$$;

create function community_private.read_account_admin_events(page_number integer)
returns table (
  id uuid, actor_id uuid, actor_name text, target_id uuid, target_handle text, operation text, reason text,
  previous_role text, new_role text, effective_until timestamptz, created_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if community_private.moderation_role() is distinct from 'admin' then raise insufficient_privilege; end if;
  if page_number is null or page_number not between 1 and 100000 then raise invalid_parameter_value; end if;

  return query
  select e.id, e.actor_id, p.display_name, e.target_id, e.target_handle, e.operation, e.reason,
    e.previous_role, e.new_role, e.effective_until, e.created_at
  from community_private.account_admin_events e
  left join public.community_profiles p on p.user_id = e.actor_id
  order by e.created_at desc, e.id desc
  offset (page_number - 1) * 20 limit 21;
end;
$$;

create function public.get_admin_community_account_events(page_number integer)
returns table (
  id uuid, actor_id uuid, actor_name text, target_id uuid, target_handle text, operation text, reason text,
  previous_role text, new_role text, effective_until timestamptz, created_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$
  select * from community_private.read_account_admin_events(page_number);
$$;

revoke all on function
  community_private.manage_account_as_admin(uuid,text,integer,text,text,text,timestamptz,text),
  public.manage_admin_community_account(uuid,text,integer,text,text,text,timestamptz,text),
  community_private.read_account_admin_events(integer), public.get_admin_community_account_events(integer)
  from public, anon, authenticated;
grant execute on function
  community_private.manage_account_as_admin(uuid,text,integer,text,text,text,timestamptz,text),
  public.manage_admin_community_account(uuid,text,integer,text,text,text,timestamptz,text),
  community_private.read_account_admin_events(integer), public.get_admin_community_account_events(integer)
  to authenticated;

commit;
