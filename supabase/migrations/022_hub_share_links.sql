-- View-only share links for presentations and assets (ROAD-D01).

create table public.hub_share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.hub_projects (id) on delete cascade,
  created_by uuid not null references public.hub_profiles (id),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  scope_type text not null check (scope_type in ('presentation', 'asset', 'board')),
  scope_id uuid not null,
  config jsonb not null default '{}',
  expires_at timestamptz,
  revoked_at timestamptz,
  view_count int not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index hub_share_links_project_id_idx on public.hub_share_links (project_id);
create index hub_share_links_token_idx on public.hub_share_links (token) where revoked_at is null;

-- Rate-limit view recording per viewer key (hashed IP or session id).
create table public.hub_share_view_dedup (
  share_link_id uuid not null references public.hub_share_links (id) on delete cascade,
  viewer_key text not null,
  last_viewed_at timestamptz not null default now(),
  primary key (share_link_id, viewer_key)
);

alter table public.hub_share_links enable row level security;
alter table public.hub_share_view_dedup enable row level security;

create policy "hub_share_links_select_editor"
  on public.hub_share_links for select to authenticated
  using (public.hub_can_edit(project_id));

create policy "hub_share_links_insert_editor"
  on public.hub_share_links for insert to authenticated
  with check (
    public.hub_can_edit(project_id)
    and created_by = auth.uid()
  );

create policy "hub_share_links_update_editor"
  on public.hub_share_links for update to authenticated
  using (public.hub_can_edit(project_id))
  with check (public.hub_can_edit(project_id));

create policy "hub_share_links_delete_editor"
  on public.hub_share_links for delete to authenticated
  using (public.hub_can_edit(project_id));

-- No anonymous access to share tables; public reads use security definer RPCs.
create policy "hub_share_view_dedup_deny"
  on public.hub_share_view_dedup for all to authenticated, anon
  using (false)
  with check (false);

-- Activity verb for link creation.
alter table public.hub_activity
  drop constraint if exists hub_activity_verb_check;

alter table public.hub_activity
  add constraint hub_activity_verb_check
  check (verb in (
    'approved',
    'rejected',
    'commented',
    'uploaded',
    'voted',
    'final',
    'restored',
    'shared'
  ));

create or replace function public.hub_resolve_share_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_link public.hub_share_links%rowtype;
  v_project_name text;
  v_shared_by text;
  v_initiative_name text;
  v_assets jsonb;
  v_comments jsonb;
  v_asset_ids uuid[];
  v_show_comments boolean;
begin
  select *
  into v_link
  from public.hub_share_links
  where token = p_token
    and revoked_at is null
    and (expires_at is null or expires_at > now());

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select p.name into v_project_name
  from public.hub_projects p
  where p.id = v_link.project_id;

  select pr.display_name into v_shared_by
  from public.hub_profiles pr
  where pr.id = v_link.created_by;

  v_show_comments := coalesce((v_link.config ->> 'showComments')::boolean, false);

  if v_link.scope_type = 'asset' then
    select i.name into v_initiative_name
    from public.hub_assets a
    join public.hub_initiatives i on i.id = a.initiative_id
    where a.id = v_link.scope_id
      and a.variant_of is null;

    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'type', a.type,
        'public_url', a.public_url,
        'tag', a.tag,
        'status', a.status,
        'sort_order', a.sort_order
      )
      order by a.sort_order, a.created_at
    ), '[]'::jsonb)
    into v_assets
    from public.hub_assets a
    where a.id = v_link.scope_id
      and a.variant_of is null
      and exists (
        select 1
        from public.hub_initiatives i
        where i.id = a.initiative_id
          and i.project_id = v_link.project_id
      );

    if v_show_comments then
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'body', c.body,
          'created_at', c.created_at,
          'author_name', coalesce(pr.display_name, 'Team member'),
          'resolved', c.resolved
        )
        order by c.created_at
      ), '[]'::jsonb)
      into v_comments
      from public.hub_comments c
      left join public.hub_profiles pr on pr.id = c.author_id
      where c.asset_id = v_link.scope_id
        and c.parent_id is null;
    end if;

  elsif v_link.scope_type = 'presentation' then
    select i.name into v_initiative_name
    from public.hub_initiatives i
    where i.id = v_link.scope_id
      and i.project_id = v_link.project_id;

    if v_link.config ? 'assetIds' then
      select array_agg(value::uuid)
      into v_asset_ids
      from jsonb_array_elements_text(v_link.config -> 'assetIds');
    end if;

    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'type', a.type,
        'public_url', a.public_url,
        'tag', a.tag,
        'status', a.status,
        'sort_order', a.sort_order
      )
      order by
        case when a.status = 'final' then 0 when a.status = 'approved' then 1 else 2 end,
        a.sort_order,
        a.created_at
    ), '[]'::jsonb)
    into v_assets
    from public.hub_assets a
    where a.initiative_id = v_link.scope_id
      and a.variant_of is null
      and a.status in ('approved', 'final')
      and (
        v_asset_ids is null
        or a.id = any(v_asset_ids)
      );

  elsif v_link.scope_type = 'board' then
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'type', a.type,
        'public_url', a.public_url,
        'tag', a.tag,
        'status', a.status,
        'sort_order', a.sort_order,
        'initiative_name', i.name
      )
      order by i.sort_order, a.sort_order, a.created_at
    ), '[]'::jsonb)
    into v_assets
    from public.hub_assets a
    join public.hub_initiatives i on i.id = a.initiative_id
    where i.review_board_id = v_link.scope_id
      and i.project_id = v_link.project_id
      and a.variant_of is null
      and a.status in ('approved', 'final');
  end if;

  return jsonb_build_object(
    'ok', true,
    'link_id', v_link.id,
    'scope_type', v_link.scope_type,
    'config', v_link.config,
    'project_name', v_project_name,
    'initiative_name', v_initiative_name,
    'shared_by', v_shared_by,
    'assets', coalesce(v_assets, '[]'::jsonb),
    'comments', coalesce(v_comments, '[]'::jsonb)
  );
end;
$$;

create or replace function public.hub_record_share_view(
  p_token text,
  p_viewer_key text default 'anonymous'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_id uuid;
  v_key text := left(coalesce(p_viewer_key, 'anonymous'), 128);
  v_last timestamptz;
begin
  select id
  into v_link_id
  from public.hub_share_links
  where token = p_token
    and revoked_at is null
    and (expires_at is null or expires_at > now());

  if not found then
    return false;
  end if;

  select last_viewed_at
  into v_last
  from public.hub_share_view_dedup
  where share_link_id = v_link_id
    and viewer_key = v_key;

  if v_last is null or v_last < now() - interval '60 seconds' then
    insert into public.hub_share_view_dedup (share_link_id, viewer_key, last_viewed_at)
    values (v_link_id, v_key, now())
    on conflict (share_link_id, viewer_key)
    do update set last_viewed_at = now();

    update public.hub_share_links
    set view_count = view_count + 1, last_viewed_at = now()
    where id = v_link_id;

    return true;
  end if;

  update public.hub_share_view_dedup
  set last_viewed_at = now()
  where share_link_id = v_link_id and viewer_key = v_key;

  return false;
end;
$$;

create or replace function public.hub_rotate_share_token(p_link_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_new_token text;
begin
  select project_id into v_project_id
  from public.hub_share_links
  where id = p_link_id;

  if not found then
    raise exception 'Share link not found';
  end if;

  if not public.hub_can_edit(v_project_id) then
    raise exception 'Editor access required';
  end if;

  v_new_token := encode(gen_random_bytes(24), 'hex');

  update public.hub_share_links
  set token = v_new_token
  where id = p_link_id;

  return v_new_token;
end;
$$;

revoke all on function public.hub_resolve_share_token(text) from public;
revoke all on function public.hub_record_share_view(text, text) from public;
revoke all on function public.hub_rotate_share_token(uuid) from public;

grant execute on function public.hub_resolve_share_token(text) to anon, authenticated, service_role;
grant execute on function public.hub_record_share_view(text, text) to anon, authenticated, service_role;
grant execute on function public.hub_rotate_share_token(uuid) to authenticated, service_role;
