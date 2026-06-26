-- Per-user favorites for project files (review boards, canvases, text documents)

create table public.hub_project_file_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.hub_profiles (id) on delete cascade,
  file_id uuid not null references public.hub_project_files (id) on delete cascade,
  favorited_at timestamptz not null default now(),
  unique (user_id, file_id)
);

create index hub_project_file_favorites_user_idx
  on public.hub_project_file_favorites (user_id);

create index hub_project_file_favorites_user_file_idx
  on public.hub_project_file_favorites (user_id, file_id);

alter table public.hub_project_file_favorites enable row level security;

create policy "hub_file_favorites_select"
  on public.hub_project_file_favorites for select to authenticated
  using (user_id = auth.uid());

create policy "hub_file_favorites_insert"
  on public.hub_project_file_favorites for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.hub_is_member(public.hub_project_id_for_file(file_id))
  );

create policy "hub_file_favorites_delete"
  on public.hub_project_file_favorites for delete to authenticated
  using (user_id = auth.uid());
