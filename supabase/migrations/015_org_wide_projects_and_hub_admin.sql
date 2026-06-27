-- Org-wide projects are visible to every hub user (editor by default).
-- Hub admins receive admin on org-wide projects and can manage org visibility later.
-- New projects remain private to their creator until shared via invite.

alter table public.hub_profiles
  add column if not exists is_hub_admin boolean not null default false;

alter table public.hub_projects
  add column if not exists is_org_wide boolean not null default false;

create index if not exists hub_projects_org_wide_idx
  on public.hub_projects (is_org_wide)
  where is_org_wide = true;

create or replace function public.hub_is_hub_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select hp.is_hub_admin
      from public.hub_profiles hp
      where hp.id = p_user_id
    ),
    false
  );
$$;

create or replace function public.hub_sync_org_wide_project_members(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.hub_projects p
    where p.id = p_project_id
      and p.is_org_wide = true
  ) then
    return;
  end if;

  insert into public.hub_project_members (project_id, user_id, role)
  select
    p_project_id,
    hp.id,
    case when hp.is_hub_admin then 'admin' else 'editor' end
  from public.hub_profiles hp
  on conflict (project_id, user_id) do nothing;
end;
$$;

create or replace function public.hub_sync_all_org_wide_project_members()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row record;
begin
  for project_row in
    select id from public.hub_projects where is_org_wide = true
  loop
    perform public.hub_sync_org_wide_project_members(project_row.id);
  end loop;
end;
$$;

create or replace function public.hub_add_creator_as_project_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.hub_project_members (project_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (project_id, user_id) do nothing;

  if new.is_org_wide then
    perform public.hub_sync_org_wide_project_members(new.id);
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_hub_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.hub_profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.hub_profiles.display_name, excluded.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.hub_profiles.avatar_url);

  insert into public.hub_project_members (project_id, user_id, role)
  select p.id, new.id, 'editor'
  from public.hub_projects p
  where p.is_org_wide = true
  on conflict (project_id, user_id) do nothing;

  return new;
end;
$$;

-- Primary hub admin
update public.hub_profiles
set is_hub_admin = true
where lower(email) = 'jas@fshdesign.org';

-- Default org-wide projects for all FSH hub accounts
update public.hub_projects
set is_org_wide = true
where lower(name) in ('blenz', 'healthy cart canada');

select public.hub_sync_all_org_wide_project_members();

revoke all on function public.hub_is_hub_admin(uuid) from public;
revoke all on function public.hub_sync_org_wide_project_members(uuid) from public;
revoke all on function public.hub_sync_all_org_wide_project_members() from public;

grant execute on function public.hub_is_hub_admin(uuid) to postgres, service_role;
grant execute on function public.hub_sync_org_wide_project_members(uuid) to postgres, service_role;
grant execute on function public.hub_sync_all_org_wide_project_members() to postgres, service_role;
