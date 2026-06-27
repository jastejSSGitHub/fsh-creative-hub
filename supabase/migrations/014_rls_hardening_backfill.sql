-- Backfill projects that were created without a membership row (failed bootstrap).
insert into public.hub_project_members (project_id, user_id, role)
select p.id, p.created_by, 'admin'
from public.hub_projects p
where not exists (
  select 1
  from public.hub_project_members m
  where m.project_id = p.id
)
on conflict (project_id, user_id) do nothing;

-- Internal helpers and trigger functions should not be callable via PostgREST RPC.
revoke all on function public.hub_add_creator_as_project_admin() from public;
revoke all on function public.handle_new_hub_user() from public;
revoke all on function public.hub_project_has_members(uuid) from public;
revoke all on function public.hub_member_role(uuid, uuid) from public;
revoke all on function public.hub_is_member(uuid) from public;
revoke all on function public.hub_can_edit(uuid) from public;
revoke all on function public.hub_can_admin(uuid) from public;
revoke all on function public.hub_project_id_for_initiative(uuid) from public;
revoke all on function public.hub_project_id_for_asset(uuid) from public;
revoke all on function public.hub_project_id_for_idea(uuid) from public;
revoke all on function public.hub_project_id_for_file(uuid) from public;

grant execute on function public.hub_add_creator_as_project_admin() to postgres, service_role;
grant execute on function public.handle_new_hub_user() to postgres, service_role;
