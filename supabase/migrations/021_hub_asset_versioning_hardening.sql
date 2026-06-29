-- Harden asset version history: referential integrity, atomic swap/restore, activity verb.

-- Deleting a root asset should remove archived versions (not orphan them on the board).
alter table public.hub_assets
  drop constraint if exists hub_assets_variant_of_fkey;

alter table public.hub_assets
  add constraint hub_assets_variant_of_fkey
  foreign key (variant_of) references public.hub_assets (id) on delete cascade;

alter table public.hub_assets
  drop constraint if exists hub_assets_variant_not_self;

alter table public.hub_assets
  add constraint hub_assets_variant_not_self
  check (variant_of is null or variant_of <> id);

create index if not exists hub_assets_variant_of_created_idx
  on public.hub_assets (variant_of, created_at)
  where variant_of is not null;

-- Only root assets may be referenced as version parents.
create or replace function public.hub_assets_enforce_variant_root()
returns trigger
language plpgsql
as $$
begin
  if new.variant_of is not null then
    if not exists (
      select 1
      from public.hub_assets parent
      where parent.id = new.variant_of
        and parent.variant_of is null
    ) then
      raise exception 'variant_of must reference a root asset';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists hub_assets_enforce_variant_root_trg on public.hub_assets;

create trigger hub_assets_enforce_variant_root_trg
  before insert or update of variant_of on public.hub_assets
  for each row
  execute function public.hub_assets_enforce_variant_root();

-- Allow logging version restores in the activity feed.
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
    'restored'
  ));

create or replace function public.hub_upload_asset_version(
  p_root_asset_id uuid,
  p_name text,
  p_type text,
  p_storage_path text,
  p_public_url text,
  p_tag text,
  p_is_fix_candidate boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_root public.hub_assets%rowtype;
  v_user uuid := auth.uid();
  v_project_id uuid;
  v_variant_count int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_root
  from public.hub_assets
  where id = p_root_asset_id
    and variant_of is null
  for update;

  if not found then
    raise exception 'Asset not found';
  end if;

  v_project_id := public.hub_project_id_for_initiative(v_root.initiative_id);

  if not public.hub_can_edit(v_project_id) then
    raise exception 'Editor access required';
  end if;

  select count(*)::int
  into v_variant_count
  from public.hub_assets
  where variant_of = v_root.id;

  if v_variant_count >= 50 then
    raise exception 'Maximum version history reached (50). Contact an admin to clean up old versions.';
  end if;

  insert into public.hub_assets (
    initiative_id,
    name,
    type,
    storage_path,
    public_url,
    tag,
    status,
    uploaded_by,
    variant_of,
    is_fix_candidate,
    legacy_approved_by,
    sort_order
  )
  values (
    v_root.initiative_id,
    v_root.name,
    v_root.type,
    v_root.storage_path,
    v_root.public_url,
    v_root.tag,
    v_root.status,
    v_user,
    v_root.id,
    v_root.is_fix_candidate,
    v_root.legacy_approved_by,
    v_root.sort_order
  );

  delete from public.hub_votes
  where asset_id = v_root.id;

  update public.hub_assets
  set
    name = p_name,
    type = p_type,
    storage_path = p_storage_path,
    public_url = p_public_url,
    tag = p_tag,
    status = 'pending',
    uploaded_by = v_user,
    is_fix_candidate = coalesce(p_is_fix_candidate, false),
    legacy_approved_by = null
  where id = v_root.id;

  return v_root.id;
end;
$$;

create or replace function public.hub_restore_asset_version(
  p_root_asset_id uuid,
  p_version_asset_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_root public.hub_assets%rowtype;
  v_version public.hub_assets%rowtype;
  v_user uuid := auth.uid();
  v_project_id uuid;
  v_variant_count int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_root
  from public.hub_assets
  where id = p_root_asset_id
    and variant_of is null
  for update;

  select *
  into v_version
  from public.hub_assets
  where id = p_version_asset_id
    and variant_of = p_root_asset_id;

  if v_root.id is null or v_version.id is null then
    raise exception 'Version not found';
  end if;

  v_project_id := public.hub_project_id_for_initiative(v_root.initiative_id);

  if not public.hub_can_edit(v_project_id) then
    raise exception 'Editor access required';
  end if;

  select count(*)::int
  into v_variant_count
  from public.hub_assets
  where variant_of = v_root.id;

  if v_variant_count >= 50 then
    raise exception 'Maximum version history reached (50). Contact an admin to clean up old versions.';
  end if;

  insert into public.hub_assets (
    initiative_id,
    name,
    type,
    storage_path,
    public_url,
    tag,
    status,
    uploaded_by,
    variant_of,
    is_fix_candidate,
    legacy_approved_by,
    sort_order
  )
  values (
    v_root.initiative_id,
    v_root.name,
    v_root.type,
    v_root.storage_path,
    v_root.public_url,
    v_root.tag,
    v_root.status,
    v_user,
    v_root.id,
    v_root.is_fix_candidate,
    v_root.legacy_approved_by,
    v_root.sort_order
  );

  delete from public.hub_votes
  where asset_id = v_root.id;

  update public.hub_assets
  set
    name = v_version.name,
    type = v_version.type,
    storage_path = v_version.storage_path,
    public_url = v_version.public_url,
    tag = v_version.tag,
    status = v_version.status,
    uploaded_by = v_user,
    is_fix_candidate = v_version.is_fix_candidate,
    legacy_approved_by = v_version.legacy_approved_by
  where id = v_root.id;

  return v_root.id;
end;
$$;

grant execute on function public.hub_upload_asset_version(uuid, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.hub_restore_asset_version(uuid, uuid) to authenticated;
