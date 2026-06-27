alter table public.hub_ideas
  add column if not exists width integer not null default 200,
  add column if not exists height integer not null default 200;

alter table public.hub_ideas
  add constraint hub_ideas_width_range check (width >= 100 and width <= 400),
  add constraint hub_ideas_height_range check (height >= 88 and height <= 400);
