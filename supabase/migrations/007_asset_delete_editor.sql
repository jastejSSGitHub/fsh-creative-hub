-- Allow editors (and admins) to delete assets they can manage
drop policy if exists "hub_assets_delete_admin" on public.hub_assets;

create policy "hub_assets_delete_editor"
  on public.hub_assets for delete to authenticated
  using (public.hub_can_edit(public.hub_project_id_for_initiative(initiative_id)));
