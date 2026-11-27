begin;

alter table public.community_profiles
  add column moderation_hidden boolean not null default false,
  add constraint community_profile_hidden_private check (not moderation_hidden or not is_public);
alter table public.community_video_lists
  add column moderation_hidden boolean not null default false,
  add constraint community_list_hidden_private check (not moderation_hidden or not is_public);

revoke insert, update on public.community_profiles from authenticated;
grant insert (user_id, handle, display_name, bio, avatar_member_id, bias_member_id, favorite_era_id, theme, is_public),
  update (handle, display_name, bio, avatar_member_id, bias_member_id, favorite_era_id, theme, is_public)
  on public.community_profiles to authenticated;

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  target_kind text not null check (target_kind in ('profile', 'list')),
  target_id uuid not null,
  target_path text not null,
  title text not null,
  content text not null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  details text not null default '' check (char_length(details) <= 400),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed', 'hidden')),
  created_at timestamptz not null default now()
);

create unique index community_reports_unique_pending
  on public.community_reports (reporter_id, target_kind, target_id) where status = 'pending';
create index community_reports_reporter_recent on public.community_reports (reporter_id, created_at desc);
create index community_reports_queue on public.community_reports (status, created_at desc, id);

create table public.community_report_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.community_reports (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text not null check (actor_role in ('admin', 'moderator')),
  decision text not null check (decision in ('resolve', 'dismiss', 'hide', 'restore')),
  note text not null default '' check (char_length(note) <= 400),
  created_at timestamptz not null default clock_timestamp()
);

create index community_report_actions_log on public.community_report_actions (report_id, created_at, id);
create index community_report_actions_actor on public.community_report_actions (actor_id);

alter table public.community_reports enable row level security;
alter table public.community_report_actions enable row level security;

create function community_private.moderation_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select case
    when exists (select 1 from public.admin_users where user_id = auth.uid() and is_active) then 'admin'
    when exists (select 1 from public.community_moderators where user_id = auth.uid() and is_active) then 'moderator'
  end;
$$;

revoke all on function community_private.moderation_role() from public, anon, authenticated;
grant execute on function community_private.moderation_role() to authenticated;

create policy "Staff read community reports" on public.community_reports for select to authenticated
  using ((select community_private.moderation_role()) is not null);
create policy "Staff read actions on community reports" on public.community_report_actions for select to authenticated
  using ((select community_private.moderation_role()) is not null);

revoke all on public.community_reports, public.community_report_actions from public, anon, authenticated;
grant select (id, target_kind, target_path, title, content, reason, details, status, created_at)
  on public.community_reports to authenticated;
grant select (id, report_id, actor_role, decision, note, created_at)
  on public.community_report_actions to authenticated;

create function community_private.submit_report(kind text, target text, category text, context text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  reporter uuid := auth.uid();
  subject_id uuid;
  owner_id uuid;
  subject_path text;
  subject_title text;
  subject_content text;
begin
  if reporter is null then raise insufficient_privilege; end if;
  if category is null or category not in ('spam', 'harassment', 'inappropriate', 'other')
    or context is null or char_length(context) > 400 then return 'invalid'; end if;

  if kind = 'profile' and target ~ '^[a-z0-9][a-z0-9_]{2,23}$' then
    select p.user_id, p.user_id, '/u/' || p.handle, p.display_name, p.bio
    into subject_id, owner_id, subject_path, subject_title, subject_content
    from public.community_profiles p where p.handle = target and p.is_public for share;
  elsif kind = 'list' and target ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then
    select l.id, l.user_id, '/lists/' || l.id, l.title, l.description
    into subject_id, owner_id, subject_path, subject_title, subject_content
    from public.community_video_lists l where l.id = target::uuid and l.is_public for share;
  else
    return 'invalid';
  end if;

  if subject_id is null then return 'unavailable'; end if;
  if owner_id = reporter then return 'self'; end if;

  -- Serialize submissions from the same account to enforce the hourly limit under concurrency.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(reporter::text, 256));
  if exists (select 1 from public.community_reports r
    where r.reporter_id = reporter and r.target_kind = kind and r.target_id = subject_id and r.status = 'pending')
  then return 'duplicate'; end if;
  if (select count(*) from public.community_reports r
    where r.reporter_id = reporter and r.created_at >= now() - interval '1 hour') >= 12
  then return 'limited'; end if;

  insert into public.community_reports (reporter_id, target_kind, target_id, target_path, title, content, reason, details)
  values (reporter, kind, subject_id, subject_path, subject_title, subject_content, category, btrim(context));
  return 'sent';
end;
$$;

create function community_private.decide_report(report uuid, action text, internal_note text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  staff_role text := community_private.moderation_role();
  selected public.community_reports%rowtype;
begin
  if staff_role is null then raise insufficient_privilege; end if;
  if action is null or action not in ('resolve', 'dismiss', 'hide', 'restore')
    or internal_note is null or char_length(internal_note) > 400 then return false; end if;

  select * into selected from public.community_reports where id = report for update;
  if not found or selected.status <> (case when action = 'restore' then 'hidden' else 'pending' end)
  then return false; end if;

  if action in ('hide', 'restore') then
    if selected.target_kind = 'profile' then
      update public.community_profiles
      set is_public = false, moderation_hidden = (action = 'hide')
      where user_id = selected.target_id
        and ((action = 'hide' and is_public) or (action = 'restore' and moderation_hidden));
    else
      update public.community_video_lists
      set is_public = false, moderation_hidden = (action = 'hide')
      where id = selected.target_id
        and ((action = 'hide' and is_public) or (action = 'restore' and moderation_hidden));
    end if;
    if not found and action = 'hide' then return false; end if;
  end if;

  update public.community_reports
  set status = case action when 'dismiss' then 'dismissed' when 'hide' then 'hidden' else 'resolved' end
  where id = report;
  insert into public.community_report_actions (report_id, actor_id, actor_role, decision, note)
  values (report, auth.uid(), staff_role, action, btrim(internal_note));
  return true;
end;
$$;

create function community_private.report_current_paths(reports uuid[])
returns table (report_id uuid, current_path text)
language sql stable security definer set search_path = ''
as $$
  select r.id, case when p.user_id is not null then '/u/' || p.handle
                    when l.id is not null then '/lists/' || l.id end
  from public.community_reports r
  left join public.community_profiles p on r.target_kind = 'profile' and p.user_id = r.target_id and p.is_public
  left join public.community_video_lists l on r.target_kind = 'list' and l.id = r.target_id and l.is_public
  where r.id = any(reports) and (select community_private.moderation_role()) is not null;
$$;

create function public.get_community_report_paths(reports uuid[])
returns table (report_id uuid, current_path text)
language sql stable security invoker set search_path = ''
as $$
  select * from community_private.report_current_paths(reports);
$$;

revoke all on function community_private.report_current_paths(uuid[]), public.get_community_report_paths(uuid[])
  from public, anon, authenticated;
grant execute on function community_private.report_current_paths(uuid[]), public.get_community_report_paths(uuid[])
  to authenticated;

create function public.submit_community_report(kind text, target text, category text, context text)
returns text
language sql security invoker set search_path = ''
as $$
  select community_private.submit_report(kind, target, category, context);
$$;

create function public.decide_community_report(report uuid, action text, internal_note text)
returns boolean
language sql security invoker set search_path = ''
as $$
  select community_private.decide_report(report, action, internal_note);
$$;

revoke all on function community_private.submit_report(text,text,text,text), community_private.decide_report(uuid,text,text),
  public.submit_community_report(text,text,text,text), public.decide_community_report(uuid,text,text)
  from public, anon, authenticated;
grant execute on function community_private.submit_report(text,text,text,text), community_private.decide_report(uuid,text,text),
  public.submit_community_report(text,text,text,text), public.decide_community_report(uuid,text,text)
  to authenticated;

commit;
