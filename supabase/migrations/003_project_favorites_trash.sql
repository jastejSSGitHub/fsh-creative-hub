-- Per-user favorites and project trash/archive

alter table public.hub_project_members
  add column if not exists is_favorite boolean not null default false,
  add column if not exists favorited_at timestamptz;

alter table public.hub_projects
  add column if not exists trashed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists hub_projects_trashed_at_idx
  on public.hub_projects (trashed_at)
  where trashed_at is not null;

create index if not exists hub_project_members_favorite_idx
  on public.hub_project_members (user_id, is_favorite)
  where is_favorite = true;

-- Members can toggle their own favorites
create policy "hub_members_update_own_favorite"
  on public.hub_project_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
