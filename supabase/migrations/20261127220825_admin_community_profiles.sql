begin;

create table community_private.profile_admin_edits (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null,
  actor_id uuid not null,
  changed_fields text[] not null check (
    cardinality(changed_fields) between 1 and 2
    and changed_fields <@ array['display_name', 'bio']
  ),
  edited_at timestamptz not null default clock_timestamp()
);

create index profile_admin_edits_by_target on community_private.profile_admin_edits (target_id, edited_at desc);
alter table community_private.profile_admin_edits enable row level security;
revoke all on community_private.profile_admin_edits from public, anon, authenticated;

create function community_private.read_profile_directory(search_term text, sort_order text, page_number integer)
returns table (
  account_id uuid,
  registered_at timestamptz,
  confirmed boolean,
  suspended_until timestamptz,
  account_role text,
  handle text,
  display_name text,
  bio text,
  is_public boolean,
  moderation_hidden boolean,
  last_edited_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  query_term text := lower(regexp_replace(btrim(search_term), '^@', ''));
begin
  if community_private.moderation_role() is distinct from 'admin' then
    raise insufficient_privilege;
  end if;
  if query_term is null or char_length(query_term) > 80
    or sort_order is null or sort_order not in ('newest', 'oldest')
    or page_number is null or page_number not between 1 and 100000 then
    raise invalid_parameter_value;
  end if;

  return query
  select u.id, u.created_at, u.email_confirmed_at is not null,
    case when u.banned_until > now() then u.banned_until end,
    case
      when exists (select 1 from public.admin_users a where a.user_id = u.id and a.is_active) then 'admin'
      when exists (select 1 from public.community_moderators m where m.user_id = u.id and m.is_active) then 'moderator'
      else 'member'
    end,
    p.handle, p.display_name, p.bio, p.is_public, p.moderation_hidden,
    (select e.edited_at from community_private.profile_admin_edits e
      where e.target_id = u.id order by e.edited_at desc limit 1)
  from auth.users u
  left join public.community_profiles p on p.user_id = u.id
  where u.deleted_at is null and not coalesce(u.is_anonymous, false)
    and (query_term = ''
      or strpos(lower(p.display_name), query_term) > 0
      or strpos(lower(p.handle), query_term) > 0)
  order by
    case when sort_order = 'newest' then u.created_at end desc nulls last,
    case when sort_order = 'oldest' then u.created_at end asc nulls last,
    u.id
  offset (page_number - 1) * 20 limit 21;
end;
$$;

create function public.get_admin_community_profiles(search_term text, sort_order text, page_number integer)
returns table (
  account_id uuid,
  registered_at timestamptz,
  confirmed boolean,
  suspended_until timestamptz,
  account_role text,
  handle text,
  display_name text,
  bio text,
  is_public boolean,
  moderation_hidden boolean,
  last_edited_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$
  select * from community_private.read_profile_directory(search_term, sort_order, page_number);
$$;

create function community_private.edit_profile_as_admin(
  target_account uuid, new_name text, new_bio text, expected_name text, expected_bio text
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  current_profile public.community_profiles%rowtype;
  fields_changed text[];
begin
  if community_private.moderation_role() is distinct from 'admin' then
    raise insufficient_privilege;
  end if;
  if target_account is null or new_name is null or char_length(btrim(new_name)) not between 1 and 40
    or new_bio is null or char_length(btrim(new_bio)) > 280
    or expected_name is null or char_length(expected_name) > 40
    or expected_bio is null or char_length(expected_bio) > 280 then
    return 'invalid';
  end if;

  select p.* into current_profile from public.community_profiles p
  join auth.users u on u.id = p.user_id and u.deleted_at is null and not coalesce(u.is_anonymous, false)
  where p.user_id = target_account for update of p;
  if not found then return 'unavailable'; end if;
  if current_profile.display_name is distinct from expected_name or current_profile.bio is distinct from expected_bio then
    return 'stale';
  end if;

  new_name := btrim(new_name);
  new_bio := btrim(new_bio);
  fields_changed := array_remove(array[
    case when current_profile.display_name <> new_name then 'display_name' end,
    case when current_profile.bio <> new_bio then 'bio' end
  ], null);
  if cardinality(fields_changed) = 0 then return 'unchanged'; end if;

  update public.community_profiles
    set display_name = new_name, bio = new_bio
    where user_id = target_account;
  insert into community_private.profile_admin_edits (target_id, actor_id, changed_fields)
    values (target_account, auth.uid(), fields_changed);

  return 'saved';
end;
$$;

create function public.edit_admin_community_profile(
  target_account uuid, new_name text, new_bio text, expected_name text, expected_bio text
)
returns text
language sql security invoker set search_path = ''
as $$
  select community_private.edit_profile_as_admin(target_account, new_name, new_bio, expected_name, expected_bio);
$$;

revoke all on function community_private.read_profile_directory(text,text,integer),
  public.get_admin_community_profiles(text,text,integer),
  community_private.edit_profile_as_admin(uuid,text,text,text,text),
  public.edit_admin_community_profile(uuid,text,text,text,text)
  from public, anon, authenticated;
grant execute on function community_private.read_profile_directory(text,text,integer),
  public.get_admin_community_profiles(text,text,integer),
  community_private.edit_profile_as_admin(uuid,text,text,text,text),
  public.edit_admin_community_profile(uuid,text,text,text,text)
  to authenticated;

commit;
