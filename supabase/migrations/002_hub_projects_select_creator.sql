-- Allow project creators to read their row during create (before membership insert)
-- and for INSERT ... RETURNING via PostgREST.

drop policy if exists "hub_projects_select_member" on public.hub_projects;

create policy "hub_projects_select_member"
  on public.hub_projects for select to authenticated
  using (
    public.hub_is_member(id)
    or created_by = auth.uid()
  );
