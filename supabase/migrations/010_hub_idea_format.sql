alter table public.hub_ideas
  add column if not exists text_size text not null default 'medium',
  add column if not exists bold boolean not null default false,
  add column if not exists strikethrough boolean not null default false;

alter table public.hub_ideas
  add constraint hub_ideas_text_size_check
    check (text_size in ('small', 'medium', 'large', 'extra-large'));
