-- Project intelligence: cached brief snapshots + searchable content index.

create type public.hub_content_source_kind as enum (
  'canvas_sticky',
  'canvas_image',
  'canvas_section',
  'canvas_embed',
  'canvas_text',
  'doc_block',
  'asset',
  'task',
  'file'
);

create table public.hub_project_briefs (
  project_id uuid primary key references public.hub_projects (id) on delete cascade,
  snapshot jsonb not null default '{}',
  snapshot_version int not null default 1,
  content_hash text not null default '',
  built_at timestamptz not null default now(),
  stale_after timestamptz,
  build_duration_ms int
);

create table public.hub_content_index (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.hub_projects (id) on delete cascade,
  source_kind public.hub_content_source_kind not null,
  source_id text not null,
  parent_file_id uuid references public.hub_project_files (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  meta jsonb not null default '{}',
  href text not null default '',
  created_at timestamptz not null default now(),
  unique (project_id, source_kind, source_id)
);

alter table public.hub_content_index
  add column tsv tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored;

create index hub_content_index_tsv_idx on public.hub_content_index using gin (tsv);
create index hub_content_index_project_kind_idx
  on public.hub_content_index (project_id, source_kind);

alter table public.hub_project_briefs enable row level security;
alter table public.hub_content_index enable row level security;

create policy hub_project_briefs_select on public.hub_project_briefs
  for select using (public.hub_is_member(project_id));

create policy hub_project_briefs_insert on public.hub_project_briefs
  for insert with check (public.hub_is_member(project_id));

create policy hub_project_briefs_update on public.hub_project_briefs
  for update using (public.hub_is_member(project_id));

create policy hub_content_index_select on public.hub_content_index
  for select using (public.hub_is_member(project_id));

create policy hub_content_index_insert on public.hub_content_index
  for insert with check (public.hub_is_member(project_id));

create policy hub_content_index_delete on public.hub_content_index
  for delete using (public.hub_is_member(project_id));
