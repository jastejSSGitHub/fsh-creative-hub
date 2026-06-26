-- FSH Creative Hub — initial schema, RLS, storage, realtime
-- Project: fsh-creative-hub (rnyeonvbnrwephpviyzu)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.hub_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.hub_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_url text,
  created_by uuid not null references public.hub_profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.hub_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.hub_projects (id) on delete cascade,
  user_id uuid not null references public.hub_profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.hub_initiatives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.hub_projects (id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.hub_assets (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.hub_initiatives (id) on delete cascade,
  name text not null,
  type text not null check (type in ('image', 'video')),
  storage_path text not null,
  public_url text not null,
  tag text not null default 'Marketing Poster',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'final')),
  uploaded_by uuid not null references public.hub_profiles (id) on delete restrict,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.hub_comments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.hub_assets (id) on delete cascade,
  parent_id uuid references public.hub_comments (id) on delete cascade,
  author_id uuid not null references public.hub_profiles (id) on delete cascade,
  body text not null,
  mentions uuid[] not null default '{}',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.hub_votes (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.hub_assets (id) on delete cascade,
  user_id uuid not null references public.hub_profiles (id) on delete cascade,
  reaction text not null check (reaction in ('fire', 'up', 'hmm', 'no')),
  created_at timestamptz not null default now(),
  unique (asset_id, user_id)
);

create table public.hub_ideas (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.hub_initiatives (id) on delete cascade,
  author_id uuid not null references public.hub_profiles (id) on delete cascade,
  body text not null,
  color text not null default 'yellow',
  created_at timestamptz not null default now()
);

create table public.hub_idea_votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.hub_ideas (id) on delete cascade,
  user_id uuid not null references public.hub_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

create table public.hub_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.hub_projects (id) on delete cascade,
  actor_id uuid not null references public.hub_profiles (id) on delete cascade,
  verb text not null check (verb in ('approved', 'rejected', 'commented', 'uploaded', 'voted', 'final')),
  target_type text not null check (target_type in ('asset', 'idea', 'initiative')),
  target_id uuid not null,
  summary text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index hub_project_members_user_id_idx on public.hub_project_members (user_id);
create index hub_project_members_project_id_idx on public.hub_project_members (project_id);
create index hub_initiatives_project_id_idx on public.hub_initiatives (project_id);
create index hub_assets_initiative_id_idx on public.hub_assets (initiative_id);
create index hub_assets_status_idx on public.hub_assets (status);
create index hub_comments_asset_id_idx on public.hub_comments (asset_id);
create index hub_votes_asset_id_idx on public.hub_votes (asset_id);
create index hub_ideas_initiative_id_idx on public.hub_ideas (initiative_id);
create index hub_activity_project_id_created_at_idx on public.hub_activity (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers (security definer to avoid RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.hub_member_role(p_project_id uuid, p_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.hub_project_members
  where project_id = p_project_id
    and user_id = p_user_id;
$$;

create or replace function public.hub_is_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hub_project_members
    where project_id = p_project_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.hub_project_id_for_initiative(p_initiative_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select project_id from public.hub_initiatives where id = p_initiative_id;
$$;

create or replace function public.hub_project_id_for_asset(p_asset_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select i.project_id
  from public.hub_assets a
  join public.hub_initiatives i on i.id = a.initiative_id
  where a.id = p_asset_id;
$$;

create or replace function public.hub_project_id_for_idea(p_idea_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select i.project_id
  from public.hub_ideas idea
  join public.hub_initiatives i on i.id = idea.initiative_id
  where idea.id = p_idea_id;
$$;

create or replace function public.hub_can_edit(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.hub_member_role(p_project_id) in ('admin', 'editor'), false);
$$;

create or replace function public.hub_can_admin(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.hub_member_role(p_project_id) = 'admin', false);
$$;

-- ---------------------------------------------------------------------------
-- Profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_hub_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.hub_profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.hub_profiles.display_name, excluded.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.hub_profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_hub on auth.users;
create trigger on_auth_user_created_hub
  after insert on auth.users
  for each row execute function public.handle_new_hub_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.hub_profiles enable row level security;
alter table public.hub_projects enable row level security;
alter table public.hub_project_members enable row level security;
alter table public.hub_initiatives enable row level security;
alter table public.hub_assets enable row level security;
alter table public.hub_comments enable row level security;
alter table public.hub_votes enable row level security;
alter table public.hub_ideas enable row level security;
alter table public.hub_idea_votes enable row level security;
alter table public.hub_activity enable row level security;

create policy "hub_profiles_select"
  on public.hub_profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.hub_project_members m1
      join public.hub_project_members m2 on m1.project_id = m2.project_id
      where m1.user_id = auth.uid() and m2.user_id = hub_profiles.id
    )
  );

create policy "hub_profiles_insert_own"
  on public.hub_profiles for insert to authenticated
  with check (id = auth.uid());

create policy "hub_profiles_update_own"
  on public.hub_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "hub_projects_select_member"
  on public.hub_projects for select to authenticated
  using (public.hub_is_member(id));

create policy "hub_projects_insert_authenticated"
  on public.hub_projects for insert to authenticated
  with check (created_by = auth.uid());

create policy "hub_projects_update_admin"
  on public.hub_projects for update to authenticated
  using (public.hub_can_admin(id))
  with check (public.hub_can_admin(id));

create policy "hub_projects_delete_admin"
  on public.hub_projects for delete to authenticated
  using (public.hub_can_admin(id));

create policy "hub_members_select"
  on public.hub_project_members for select to authenticated
  using (public.hub_is_member(project_id));

create policy "hub_members_insert_admin"
  on public.hub_project_members for insert to authenticated
  with check (
    public.hub_can_admin(project_id)
    or (
      user_id = auth.uid()
      and role = 'admin'
      and not exists (
        select 1 from public.hub_project_members where project_id = hub_project_members.project_id
      )
    )
  );

create policy "hub_members_update_admin"
  on public.hub_project_members for update to authenticated
  using (public.hub_can_admin(project_id))
  with check (public.hub_can_admin(project_id));

create policy "hub_members_delete_admin"
  on public.hub_project_members for delete to authenticated
  using (public.hub_can_admin(project_id));

create policy "hub_initiatives_select"
  on public.hub_initiatives for select to authenticated
  using (public.hub_is_member(project_id));

create policy "hub_initiatives_insert_editor"
  on public.hub_initiatives for insert to authenticated
  with check (public.hub_can_edit(project_id));

create policy "hub_initiatives_update_editor"
  on public.hub_initiatives for update to authenticated
  using (public.hub_can_edit(project_id))
  with check (public.hub_can_edit(project_id));

create policy "hub_initiatives_delete_admin"
  on public.hub_initiatives for delete to authenticated
  using (public.hub_can_admin(project_id));

create policy "hub_assets_select"
  on public.hub_assets for select to authenticated
  using (public.hub_is_member(public.hub_project_id_for_initiative(initiative_id)));

create policy "hub_assets_insert_editor"
  on public.hub_assets for insert to authenticated
  with check (
    public.hub_can_edit(public.hub_project_id_for_initiative(initiative_id))
    and uploaded_by = auth.uid()
  );

create policy "hub_assets_update_editor"
  on public.hub_assets for update to authenticated
  using (public.hub_can_edit(public.hub_project_id_for_initiative(initiative_id)))
  with check (
    public.hub_can_edit(public.hub_project_id_for_initiative(initiative_id))
    and (
      status is distinct from 'final'
      or public.hub_can_admin(public.hub_project_id_for_initiative(initiative_id))
    )
  );

create policy "hub_assets_delete_admin"
  on public.hub_assets for delete to authenticated
  using (public.hub_can_admin(public.hub_project_id_for_initiative(initiative_id)));

create policy "hub_comments_select"
  on public.hub_comments for select to authenticated
  using (public.hub_is_member(public.hub_project_id_for_asset(asset_id)));

create policy "hub_comments_insert_member"
  on public.hub_comments for insert to authenticated
  with check (
    public.hub_is_member(public.hub_project_id_for_asset(asset_id))
    and author_id = auth.uid()
  );

create policy "hub_comments_update"
  on public.hub_comments for update to authenticated
  using (
    author_id = auth.uid()
    or public.hub_can_admin(public.hub_project_id_for_asset(asset_id))
  )
  with check (
    author_id = auth.uid()
    or public.hub_can_admin(public.hub_project_id_for_asset(asset_id))
  );

create policy "hub_comments_delete"
  on public.hub_comments for delete to authenticated
  using (
    author_id = auth.uid()
    or public.hub_can_admin(public.hub_project_id_for_asset(asset_id))
  );

create policy "hub_votes_select"
  on public.hub_votes for select to authenticated
  using (public.hub_is_member(public.hub_project_id_for_asset(asset_id)));

create policy "hub_votes_insert_member"
  on public.hub_votes for insert to authenticated
  with check (
    public.hub_is_member(public.hub_project_id_for_asset(asset_id))
    and user_id = auth.uid()
  );

create policy "hub_votes_update_own"
  on public.hub_votes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "hub_votes_delete_own"
  on public.hub_votes for delete to authenticated
  using (user_id = auth.uid());

create policy "hub_ideas_select"
  on public.hub_ideas for select to authenticated
  using (public.hub_is_member(public.hub_project_id_for_initiative(initiative_id)));

create policy "hub_ideas_insert_editor"
  on public.hub_ideas for insert to authenticated
  with check (
    public.hub_can_edit(public.hub_project_id_for_initiative(initiative_id))
    and author_id = auth.uid()
  );

create policy "hub_ideas_update"
  on public.hub_ideas for update to authenticated
  using (
    author_id = auth.uid()
    or public.hub_can_edit(public.hub_project_id_for_initiative(initiative_id))
  )
  with check (
    author_id = auth.uid()
    or public.hub_can_edit(public.hub_project_id_for_initiative(initiative_id))
  );

create policy "hub_ideas_delete"
  on public.hub_ideas for delete to authenticated
  using (
    author_id = auth.uid()
    or public.hub_can_admin(public.hub_project_id_for_initiative(initiative_id))
  );

create policy "hub_idea_votes_select"
  on public.hub_idea_votes for select to authenticated
  using (public.hub_is_member(public.hub_project_id_for_idea(idea_id)));

create policy "hub_idea_votes_insert_member"
  on public.hub_idea_votes for insert to authenticated
  with check (
    public.hub_is_member(public.hub_project_id_for_idea(idea_id))
    and user_id = auth.uid()
  );

create policy "hub_idea_votes_delete_own"
  on public.hub_idea_votes for delete to authenticated
  using (user_id = auth.uid());

create policy "hub_activity_select"
  on public.hub_activity for select to authenticated
  using (public.hub_is_member(project_id));

create policy "hub_activity_insert_member"
  on public.hub_activity for insert to authenticated
  with check (
    public.hub_is_member(project_id)
    and actor_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Storage: hub-media bucket (public read)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hub-media',
  'hub-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public;

create policy "hub_media_public_read"
  on storage.objects for select
  using (bucket_id = 'hub-media');

create policy "hub_media_authenticated_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'hub-media');

create policy "hub_media_authenticated_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'hub-media');

create policy "hub_media_authenticated_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'hub-media');

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.hub_comments replica identity full;
alter table public.hub_votes replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.hub_comments;
    alter publication supabase_realtime add table public.hub_votes;
  end if;
exception
  when duplicate_object then null;
end $$;
