-- Test fixtures are rolled back.
begin;

insert into auth.users (id) values
  ('4a91df15-87af-4ee9-8367-35efe6f75201'),
  ('4a91df15-87af-4ee9-8367-35efe6f75202');

set local role authenticated;
select set_config('request.jwt.claim.sub', '4a91df15-87af-4ee9-8367-35efe6f75201', true);
select public.save_community_profile('phase25_check', 'Profile check', 'Bio', null, null, null, 'rose', false, false, false);

do $$
begin
  if not exists (
    select 1 from public.community_profiles p
    join public.community_profile_settings s using (user_id)
    where p.handle = 'phase25_check' and not p.is_public and not s.share_favorites and not s.share_history
  ) then
    raise exception 'Owner defaults or save failed';
  end if;
end;
$$;

set local role anon;
do $$
begin
  if exists (select handle from public.community_profiles where handle = 'phase25_check') then
    raise exception 'Private profile visible to a visitor';
  end if;
  if has_column_privilege(current_user, 'public.community_profiles', 'user_id', 'select')
    or has_table_privilege(current_user, 'public.community_profile_settings', 'select')
    or has_function_privilege(current_user, 'public.save_community_profile(text,text,text,uuid,uuid,uuid,text,boolean,boolean,boolean)', 'execute')
  then
    raise exception 'Unexpected visitor privileges';
  end if;
end;
$$;

set local role authenticated;
select public.save_community_profile('phase25_check', 'Profile check', 'Bio', null, null, null, 'midnight', true, true, false);
select set_config('request.jwt.claim.sub', '4a91df15-87af-4ee9-8367-35efe6f75202', true);

do $$
begin
  if exists (select 1 from public.community_profiles where user_id = '4a91df15-87af-4ee9-8367-35efe6f75201')
    or exists (select 1 from public.community_profile_settings where user_id = '4a91df15-87af-4ee9-8367-35efe6f75201') then
    raise exception 'Another authenticated user can read owner data';
  end if;
  update public.community_profiles set bio = 'Changed by another member' where handle = 'phase25_check';
  if found then
    raise exception 'Another account can alter public profiles';
  end if;
  begin
    perform public.save_community_profile('phase25_check', 'Duplicate', '', null, null, null, 'violet', false, false, false);
    raise exception 'Duplicate handle was accepted';
  exception when unique_violation then null;
  end;
end;
$$;

set local role anon;
do $$
begin
  if not exists (select handle from public.community_profiles where handle = 'phase25_check' and theme = 'midnight') then
    raise exception 'Public profile unavailable';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '4a91df15-87af-4ee9-8367-35efe6f75201', true);
select public.save_community_profile('phase25_check', 'Profile check', 'Bio', null, null, null, 'midnight', false, true, false);

set local role anon;
do $$
begin
  if exists (select handle from public.community_profiles where handle = 'phase25_check') then
    raise exception 'Previously public profile still visible';
  end if;
end;
$$;

reset role;
select 'PASS: profile privacy, owner permissions, unique handle and unpublishing' as result;
rollback;
