-- Inbox task SELECT used hub_can_access_inbox_task(id), which subqueries hub_tasks
-- during INSERT ... RETURNING and blocked the row from being returned to the client.
-- Inline creator/assignee checks fix create + returning for inbox (project_id IS NULL) tasks.

drop policy if exists "hub_tasks_select" on public.hub_tasks;

create policy "hub_tasks_select"
  on public.hub_tasks for select to authenticated
  using (
    (project_id is not null and public.hub_is_member(project_id))
    or (
      project_id is null
      and (created_by = auth.uid() or assignee_id = auth.uid())
    )
  );
