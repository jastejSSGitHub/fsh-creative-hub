-- FSH Creative Hub — Tasks module (Todoist-style)

create table public.hub_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.hub_projects (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.hub_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.hub_projects (id) on delete cascade,
  section_id uuid references public.hub_sections (id) on delete set null,
  parent_id uuid references public.hub_tasks (id) on delete cascade,
  name text not null,
  description text,
  due_at timestamptz,
  priority int not null default 4 check (priority between 1 and 4),
  assignee_id uuid references public.hub_profiles (id) on delete set null,
  recurring_rule text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_by uuid not null references public.hub_profiles (id) on delete restrict,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint hub_tasks_inbox_no_section check (
    project_id is not null or section_id is null
  ),
  constraint hub_tasks_section_requires_project check (
    section_id is null or project_id is not null
  )
);

create table public.hub_labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#64748b',
  scope text not null default 'workspace' check (scope in ('workspace')),
  created_at timestamptz not null default now(),
  unique (scope, name)
);

create table public.hub_task_labels (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.hub_tasks (id) on delete cascade,
  label_id uuid not null references public.hub_labels (id) on delete cascade,
  unique (task_id, label_id)
);

create table public.hub_filters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.hub_profiles (id) on delete cascade,
  name text not null,
  query text not null,
  color text not null default '#64748b',
  is_favorite boolean not null default false,
  is_preset boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.hub_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.hub_tasks (id) on delete cascade,
  author_id uuid not null references public.hub_profiles (id) on delete cascade,
  body text not null,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index hub_sections_project_id_sort_idx
  on public.hub_sections (project_id, sort_order);

create index hub_tasks_project_id_sort_idx
  on public.hub_tasks (project_id, sort_order)
  where project_id is not null;

create index hub_tasks_inbox_owner_idx
  on public.hub_tasks (created_by, sort_order)
  where project_id is null;

create index hub_tasks_section_id_idx on public.hub_tasks (section_id);
create index hub_tasks_parent_id_idx on public.hub_tasks (parent_id);
create index hub_tasks_assignee_id_idx on public.hub_tasks (assignee_id);
create index hub_tasks_due_at_idx on public.hub_tasks (due_at) where not completed;
create index hub_tasks_completed_idx on public.hub_tasks (completed, completed_at);

create index hub_task_labels_task_id_idx on public.hub_task_labels (task_id);
create index hub_task_labels_label_id_idx on public.hub_task_labels (label_id);

create index hub_filters_owner_id_idx on public.hub_filters (owner_id);
create unique index hub_filters_preset_name_uidx
  on public.hub_filters (name)
  where is_preset = true;

create index hub_task_comments_task_id_idx on public.hub_task_comments (task_id);

create or replace function public.hub_project_id_for_section(p_section_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select project_id from public.hub_sections where id = p_section_id;
$$;

create or replace function public.hub_project_id_for_task(p_task_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select project_id from public.hub_tasks where id = p_task_id;
$$;

create or replace function public.hub_can_access_inbox_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hub_tasks t
    where t.id = p_task_id
      and t.project_id is null
      and (t.created_by = auth.uid() or t.assignee_id = auth.uid())
  );
$$;

create or replace function public.hub_can_access_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    case
      when p.project_id is not null then public.hub_is_member(p.project_id)
      else public.hub_can_access_inbox_task(p_task_id)
    end
  from public.hub_tasks p
  where p.id = p_task_id;
$$;

create or replace function public.hub_can_edit_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    case
      when p.project_id is not null then public.hub_can_edit(p.project_id)
      else (p.created_by = auth.uid() or p.assignee_id = auth.uid())
    end
  from public.hub_tasks p
  where p.id = p_task_id;
$$;

create or replace function public.hub_enforce_task_nesting()
returns trigger language plpgsql set search_path = public as $$
declare
  parent_parent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select parent_id into parent_parent
  from public.hub_tasks
  where id = new.parent_id;

  if parent_parent is not null then
    raise exception 'Tasks support at most 2 levels (sub-tasks cannot have children)';
  end if;

  if exists (
    select 1 from public.hub_tasks parent
    where parent.id = new.parent_id
      and parent.project_id is distinct from new.project_id
  ) then
    raise exception 'Sub-task must belong to the same project as its parent';
  end if;

  return new;
end;
$$;

create trigger hub_tasks_enforce_nesting
  before insert or update of parent_id on public.hub_tasks
  for each row execute function public.hub_enforce_task_nesting();

alter table public.hub_sections enable row level security;
alter table public.hub_tasks enable row level security;
alter table public.hub_labels enable row level security;
alter table public.hub_task_labels enable row level security;
alter table public.hub_filters enable row level security;
alter table public.hub_task_comments enable row level security;

create policy "hub_sections_select"
  on public.hub_sections for select to authenticated
  using (public.hub_is_member(project_id));

create policy "hub_sections_insert_editor"
  on public.hub_sections for insert to authenticated
  with check (public.hub_can_edit(project_id));

create policy "hub_sections_update_editor"
  on public.hub_sections for update to authenticated
  using (public.hub_can_edit(project_id))
  with check (public.hub_can_edit(project_id));

create policy "hub_sections_delete_editor"
  on public.hub_sections for delete to authenticated
  using (public.hub_can_edit(project_id));

create policy "hub_tasks_select"
  on public.hub_tasks for select to authenticated
  using (
    (project_id is not null and public.hub_is_member(project_id))
    or public.hub_can_access_inbox_task(id)
  );

create policy "hub_tasks_insert"
  on public.hub_tasks for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      (project_id is not null and public.hub_can_edit(project_id))
      or project_id is null
    )
  );

create policy "hub_tasks_update"
  on public.hub_tasks for update to authenticated
  using (public.hub_can_edit_task(id))
  with check (public.hub_can_edit_task(id));

create policy "hub_tasks_delete"
  on public.hub_tasks for delete to authenticated
  using (public.hub_can_edit_task(id));

create policy "hub_labels_select"
  on public.hub_labels for select to authenticated
  using (true);

create policy "hub_labels_insert_admin"
  on public.hub_labels for insert to authenticated
  with check (
    exists (
      select 1 from public.hub_profiles
      where id = auth.uid() and is_hub_admin
    )
  );

create policy "hub_labels_update_admin"
  on public.hub_labels for update to authenticated
  using (
    exists (
      select 1 from public.hub_profiles
      where id = auth.uid() and is_hub_admin
    )
  );

create policy "hub_labels_delete_admin"
  on public.hub_labels for delete to authenticated
  using (
    exists (
      select 1 from public.hub_profiles
      where id = auth.uid() and is_hub_admin
    )
  );

create policy "hub_task_labels_select"
  on public.hub_task_labels for select to authenticated
  using (public.hub_can_access_task(task_id));

create policy "hub_task_labels_insert"
  on public.hub_task_labels for insert to authenticated
  with check (public.hub_can_edit_task(task_id));

create policy "hub_task_labels_delete"
  on public.hub_task_labels for delete to authenticated
  using (public.hub_can_edit_task(task_id));

create policy "hub_filters_select"
  on public.hub_filters for select to authenticated
  using (owner_id is null or owner_id = auth.uid() or is_preset = true);

create policy "hub_filters_insert_own"
  on public.hub_filters for insert to authenticated
  with check (owner_id = auth.uid() and is_preset = false);

create policy "hub_filters_update_own"
  on public.hub_filters for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "hub_filters_delete_own"
  on public.hub_filters for delete to authenticated
  using (owner_id = auth.uid());

create policy "hub_task_comments_select"
  on public.hub_task_comments for select to authenticated
  using (public.hub_can_access_task(task_id));

create policy "hub_task_comments_insert"
  on public.hub_task_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.hub_can_access_task(task_id)
  );

create policy "hub_task_comments_update_own"
  on public.hub_task_comments for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "hub_task_comments_delete_own"
  on public.hub_task_comments for delete to authenticated
  using (author_id = auth.uid());

alter publication supabase_realtime add table public.hub_tasks;
alter publication supabase_realtime add table public.hub_task_comments;

insert into public.hub_labels (name, color, scope) values
  ('design',    '#6366f1', 'workspace'),
  ('marketing', '#ec4899', 'workspace'),
  ('tech',      '#0ea5e9', 'workspace'),
  ('print',     '#8b5cf6', 'workspace'),
  ('backend',   '#14b8a6', 'workspace'),
  ('urgent',    '#ef4444', 'workspace'),
  ('quick',     '#22c55e', 'workspace'),
  ('waiting',   '#f59e0b', 'workspace'),
  ('client',    '#3b82f6', 'workspace'),
  ('internal',  '#64748b', 'workspace')
on conflict (scope, name) do nothing;

insert into public.hub_filters (owner_id, name, query, color, is_favorite, is_preset) values
  (null, 'My Tasks Today',  'today & assigned to: me', '#18a0fb', true,  true),
  (null, 'Overdue',         'overdue',                 '#ef4444', true,  true),
  (null, 'Awaiting Client', '@waiting | @client',      '#f59e0b', false, true),
  (null, 'Design',          '@design',                 '#6366f1', false, true),
  (null, 'Marketing',       '@marketing',              '#ec4899', false, true),
  (null, 'Tech',            '@tech',                   '#0ea5e9', false, true)
on conflict (name) where is_preset = true do nothing;

revoke all on function public.hub_project_id_for_section(uuid) from public;
revoke all on function public.hub_project_id_for_task(uuid) from public;
revoke all on function public.hub_can_access_inbox_task(uuid) from public;
revoke all on function public.hub_can_access_task(uuid) from public;
revoke all on function public.hub_can_edit_task(uuid) from public;

grant execute on function public.hub_project_id_for_section(uuid) to postgres, service_role;
grant execute on function public.hub_project_id_for_task(uuid) to postgres, service_role;
grant execute on function public.hub_can_access_inbox_task(uuid) to postgres, service_role;
grant execute on function public.hub_can_access_task(uuid) to postgres, service_role;
grant execute on function public.hub_can_edit_task(uuid) to postgres, service_role;
