-- Only allow deleting assets you uploaded (editors and admins included)
drop policy if exists "hub_assets_delete_editor" on public.hub_assets;

create policy "hub_assets_delete_own"
  on public.hub_assets for delete to authenticated
  using (
    uploaded_by = auth.uid()
    and public.hub_can_edit(public.hub_project_id_for_initiative(initiative_id))
  );
