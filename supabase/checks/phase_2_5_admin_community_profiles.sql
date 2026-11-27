-- Run against homologation after the migration. Fixtures and edits are rolled back.
begin;

insert into auth.users (id, created_at, email_confirmed_at, banned_until) values
  ('b2361e26-a3dc-43ed-8be4-509766e3db01', now(), now(), null),
  ('b2361e26-a3dc-43ed-8be4-509766e3db02', now(), now(), null),
  ('b2361e26-a3dc-43ed-8be4-509766e3db03', now() - interval '1 day', now(), null),
  ('b2361e26-a3dc-43ed-8be4-509766e3db04', now(), now(), now() + interval '1 day'),
  ('b2361e26-a3dc-43ed-8be4-509766e3db05', now() + interval '100 years', null, null),
  ('b2361e26-a3dc-43ed-8be4-509766e3db06', now(), now(), null);

insert into public.admin_users (user_id, is_active) values
  ('b2361e26-a3dc-43ed-8be4-509766e3db01', true),
  ('b2361e26-a3dc-43ed-8be4-509766e3db06', false);
insert into public.community_moderators (user_id)
values ('b2361e26-a3dc-43ed-8be4-509766e3db02');
insert into public.community_profiles (user_id, handle, display_name, bio, is_public) values
  ('b2361e26-a3dc-43ed-8be4-509766e3db03', 'qa_dir_alpha', 'QA directory older', 'Original bio', false),
  ('b2361e26-a3dc-43ed-8be4-509766e3db04', 'qa_dir_beta', 'QA directory newer', '', true);

set local role anon;
do $$
begin
  if has_function_privilege(current_user, 'public.get_admin_community_profiles(text,text,integer)', 'EXECUTE')
    or has_function_privilege(current_user, 'public.edit_admin_community_profile(uuid,text,text,text,text)', 'EXECUTE') then
    raise exception 'Visitor can access profile admin RPC';
  end if;
end;
$$;

set local role authenticated;
do $$
declare
  actor uuid;
begin
  foreach actor in array array[
    'b2361e26-a3dc-43ed-8be4-509766e3db02'::uuid,
    'b2361e26-a3dc-43ed-8be4-509766e3db03'::uuid,
    'b2361e26-a3dc-43ed-8be4-509766e3db06'::uuid
  ] loop
    perform set_config('request.jwt.claim.sub', actor::text, true);
    begin
      perform public.get_admin_community_profiles('', 'newest', 1);
      raise exception 'Non-admin can list community profiles';
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.edit_admin_community_profile('b2361e26-a3dc-43ed-8be4-509766e3db03', 'Blocked', '', 'QA directory older', 'Original bio');
      raise exception 'Non-admin can edit through profile admin RPC';
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

select set_config('request.jwt.claim.sub','b2361e26-a3dc-43ed-8be4-509766e3db01',true);
do $$
declare
  older uuid := 'b2361e26-a3dc-43ed-8be4-509766e3db03';
  newer uuid := 'b2361e26-a3dc-43ed-8be4-509766e3db04';
  incomplete uuid := 'b2361e26-a3dc-43ed-8be4-509766e3db05';
begin
  if (select account_id from public.get_admin_community_profiles('QA DIRECTORY','newest',1) limit 1) is distinct from newer
    or (select account_id from public.get_admin_community_profiles('qa directory','oldest',1) limit 1) is distinct from older
    or (select account_id from public.get_admin_community_profiles('@qa_dir_alpha','newest',1) limit 1) is distinct from older
    or exists (select from public.get_admin_community_profiles('%_','newest',1)) then
    raise exception 'Search or registration sorting failed';
  end if;
  if not exists (select from public.get_admin_community_profiles('qa_dir_beta','newest',1) where confirmed and suspended_until > now())
    or not exists (select from public.get_admin_community_profiles('','newest',1) where account_id = incomplete and handle is null and not confirmed) then
    raise exception 'Missing Auth status or incomplete account';
  end if;
  if public.edit_admin_community_profile(incomplete,'Not created','','','') <> 'unavailable'
    or public.edit_admin_community_profile(older,'   ','','QA directory older','Original bio') <> 'invalid'
    or public.edit_admin_community_profile(older,'QA directory older','Original bio','QA directory older','Original bio') <> 'unchanged'
    or public.edit_admin_community_profile(older,'QA directory updated','New bio','QA directory older','Original bio') <> 'saved'
    or public.edit_admin_community_profile(older,'Stale change','Lost bio','QA directory older','Original bio') <> 'stale' then
    raise exception 'Admin edit, validation or concurrent change detection failed';
  end if;
  if not exists (select from public.get_admin_community_profiles('@qa_dir_alpha','newest',1)
    where display_name = 'QA directory updated' and bio = 'New bio' and not is_public
      and account_role = 'member' and last_edited_at is not null) then
    raise exception 'Edit changed privacy, role or missed the audit timestamp';
  end if;
  if has_table_privilege(current_user, 'community_private.profile_admin_edits', 'SELECT') then
    raise exception 'Audit table exposed to authenticated clients';
  end if;
end;
$$;

reset role;
do $$
begin
  if (select count(*) from community_private.profile_admin_edits
    where actor_id='b2361e26-a3dc-43ed-8be4-509766e3db01'
      and target_id='b2361e26-a3dc-43ed-8be4-509766e3db03'
      and changed_fields = array['display_name','bio']) <> 1 then
    raise exception 'Unexpected audit records';
  end if;
end;
$$;
select 'PASS: administrator-only directory, sorting, search, audited edits and stale write protection' as result;
rollback;
