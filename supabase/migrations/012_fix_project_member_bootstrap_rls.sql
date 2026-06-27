-- Fix bootstrap member insert: the original policy subquery referenced
-- hub_project_members.project_id inside a FROM hub_project_members subquery,
-- so the comparison was always true for any visible row and blocked first admin insert.

create or replace function public.hub_project_has_members(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hub_project_members
    where project_id = p_project_id
  );
$$;

drop policy if exists "hub_members_insert_admin" on public.hub_project_members;

create policy "hub_members_insert_admin"
  on public.hub_project_members for insert to authenticated
  with check (
    public.hub_can_admin(project_id)
    or (
      user_id = auth.uid()
      and role = 'admin'
      and not public.hub_project_has_members(project_id)
      and exists (
        select 1
        from public.hub_projects p
        where p.id = project_id
          and p.created_by = auth.uid()
      )
    )
  );
