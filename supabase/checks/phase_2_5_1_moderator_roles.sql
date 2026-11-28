-- Run in the test project after applying the moderator migration.
begin;

insert into auth.users (id) values
  ('9aba0125-21d2-4c55-8b3a-23a052500011'),
  ('9aba0125-21d2-4c55-8b3a-23a052500012'),
  ('9aba0125-21d2-4c55-8b3a-23a052500013');

insert into public.community_moderators (user_id, is_active) values
  ('9aba0125-21d2-4c55-8b3a-23a052500011', true),
  ('9aba0125-21d2-4c55-8b3a-23a052500012', false);

set local role authenticated;

do $test$
declare
  member_id text;
  expected_count int;
begin
  foreach member_id in array array[
    '9aba0125-21d2-4c55-8b3a-23a052500011',
    '9aba0125-21d2-4c55-8b3a-23a052500012',
    '9aba0125-21d2-4c55-8b3a-23a052500013'
  ] loop
    perform set_config('request.jwt.claim.sub', member_id, true);
    expected_count := case when member_id like '%11' then 1 else 0 end;
    if (select count(user_id) from public.community_moderators) <> expected_count then
      raise exception 'Unexpected moderator visibility';
    end if;
  end loop;

  begin
    insert into public.community_moderators (user_id)
    values ('9aba0125-21d2-4c55-8b3a-23a052500013');
    raise exception 'Member can grant moderation';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.community_moderators set is_active = true;
    raise exception 'Member can update moderator roles';
  exception when insufficient_privilege then null;
  end;
end $test$;

set local role anon;

do $test$
begin
  begin
    perform user_id from public.community_moderators;
    raise exception 'Anonymous access to moderators';
  exception when insufficient_privilege then null;
  end;
end $test$;

reset role;
select 'PASS: moderator membership visibility and role assignment' as result;
rollback;
