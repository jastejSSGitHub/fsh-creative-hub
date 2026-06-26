-- Add text_document as a third project file type (Notion-style wiki pages)

alter table public.hub_project_files
  drop constraint if exists hub_project_files_type_check;

alter table public.hub_project_files
  add constraint hub_project_files_type_check
  check (type in ('review_board', 'canvas', 'text_document'));
