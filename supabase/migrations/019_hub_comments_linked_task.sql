-- Link asset comments to tasks (thread → task → resolve loop)

alter table public.hub_comments
  add column if not exists linked_task_id uuid references public.hub_tasks (id) on delete set null;

create index if not exists hub_comments_linked_task_id_idx
  on public.hub_comments (linked_task_id)
  where linked_task_id is not null;
