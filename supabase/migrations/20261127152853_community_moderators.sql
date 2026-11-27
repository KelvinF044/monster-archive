begin;

create table public.community_moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_active boolean not null default true
);

alter table public.community_moderators enable row level security;
revoke all on table public.community_moderators from public, anon, authenticated;
grant select (user_id, is_active) on public.community_moderators to authenticated;
grant select, insert, update, delete on public.community_moderators to service_role;

create policy "Moderators can read own active membership"
  on public.community_moderators
  for select
  to authenticated
  using (user_id = (select auth.uid()) and is_active);

commit;
