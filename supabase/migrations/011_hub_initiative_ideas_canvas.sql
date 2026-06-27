alter table public.hub_initiatives
  add column if not exists ideas_canvas_id uuid references public.hub_project_files (id) on delete set null;

create index if not exists hub_initiatives_ideas_canvas_id_idx
  on public.hub_initiatives (ideas_canvas_id)
  where ideas_canvas_id is not null;
