-- Task ↔ asset linking for creative workflow

create table public.hub_task_assets (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.hub_tasks (id) on delete cascade,
  asset_id uuid not null references public.hub_assets (id) on delete cascade,
  created_by uuid not null references public.hub_profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (task_id, asset_id)
);

create index hub_task_assets_task_id_idx on public.hub_task_assets (task_id);
create index hub_task_assets_asset_id_idx on public.hub_task_assets (asset_id);

create or replace function public.hub_can_access_task_asset(p_task_id uuid, p_asset_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.hub_can_access_task(p_task_id)
    and public.hub_is_member(public.hub_project_id_for_initiative(
      (select initiative_id from public.hub_assets where id = p_asset_id)
    ));
$$;

alter table public.hub_task_assets enable row level security;

create policy "hub_task_assets_select"
  on public.hub_task_assets for select to authenticated
  using (public.hub_can_access_task_asset(task_id, asset_id));

create policy "hub_task_assets_insert"
  on public.hub_task_assets for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.hub_can_edit_task(task_id)
    and public.hub_can_access_task_asset(task_id, asset_id)
  );

create policy "hub_task_assets_delete"
  on public.hub_task_assets for delete to authenticated
  using (public.hub_can_edit_task(task_id));

revoke all on function public.hub_can_access_task_asset(uuid, uuid) from public;
grant execute on function public.hub_can_access_task_asset(uuid, uuid) to postgres, service_role;
