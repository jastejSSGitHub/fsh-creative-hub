-- Project files (review boards, canvas) + review board sections + asset extensions

create table public.hub_project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.hub_projects (id) on delete cascade,
  type text not null check (type in ('review_board', 'canvas')),
  name text not null,
  config jsonb not null default '{}',
  sort_order int not null default 0,
  created_by uuid not null references public.hub_profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index hub_project_files_project_id_idx on public.hub_project_files (project_id);

alter table public.hub_initiatives
  add column review_board_id uuid references public.hub_project_files (id) on delete cascade;

create index hub_initiatives_review_board_id_idx on public.hub_initiatives (review_board_id);

alter table public.hub_assets
  add column variant_of uuid references public.hub_assets (id) on delete set null,
  add column is_fix_candidate boolean not null default false,
  add column legacy_approved_by text;

create index hub_assets_variant_of_idx on public.hub_assets (variant_of);

create or replace function public.hub_project_id_for_file(p_file_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select project_id from public.hub_project_files where id = p_file_id;
$$;

alter table public.hub_project_files enable row level security;

create policy "hub_project_files_select"
  on public.hub_project_files for select to authenticated
  using (public.hub_is_member(project_id));

create policy "hub_project_files_insert_editor"
  on public.hub_project_files for insert to authenticated
  with check (
    public.hub_can_edit(project_id)
    and created_by = auth.uid()
  );

create policy "hub_project_files_update_editor"
  on public.hub_project_files for update to authenticated
  using (public.hub_can_edit(project_id))
  with check (public.hub_can_edit(project_id));

create policy "hub_project_files_delete_admin"
  on public.hub_project_files for delete to authenticated
  using (public.hub_can_admin(project_id));
