-- Automatically add the project creator as admin so client code never hits
-- membership bootstrap RLS during project create / duplicate flows.

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

  return new;
end;
$$;

drop trigger if exists hub_projects_add_creator_member on public.hub_projects;

create trigger hub_projects_add_creator_member
  after insert on public.hub_projects
  for each row
  execute function public.hub_add_creator_as_project_admin();
