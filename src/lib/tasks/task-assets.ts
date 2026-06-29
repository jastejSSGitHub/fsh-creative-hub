import type { SupabaseClient } from "@supabase/supabase-js";

export type LinkedAssetSummary = {
  id: string;
  name: string;
  public_url: string | null;
  initiative_id: string;
  project_id: string;
  type?: "image" | "video" | "review_board" | "text_document" | string | null;
};

export async function getAssetsForTask(
  supabase: SupabaseClient,
  taskId: string,
): Promise<LinkedAssetSummary[]> {
  const { data, error } = await supabase
    .from("hub_task_assets")
    .select(
      `
      asset:hub_assets (
        id,
        name,
        public_url,
        type,
        initiative_id,
        initiative:hub_initiatives (project_id)
      )
    `,
    )
    .eq("task_id", taskId);

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const asset = Array.isArray(row.asset) ? row.asset[0] : row.asset;
    if (!asset) return [];
    const initiative = Array.isArray(asset.initiative)
      ? asset.initiative[0]
      : asset.initiative;
    if (!initiative) return [];
    return [
      {
        id: asset.id,
        name: asset.name,
        public_url: asset.public_url,
        initiative_id: asset.initiative_id,
        project_id: initiative.project_id,
        type: asset.type ?? null,
      },
    ];
  });
}

export type TaskOnAssetSummary = {
  id: string;
  name: string;
  completed: boolean;
  assignee_id: string | null;
};

export async function getTasksForAsset(
  supabase: SupabaseClient,
  assetId: string,
): Promise<TaskOnAssetSummary[]> {
  const { data, error } = await supabase
    .from("hub_task_assets")
    .select(
      `
      task:hub_tasks (id, name, completed, assignee_id)
    `,
    )
    .eq("asset_id", assetId);

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const task = Array.isArray(row.task) ? row.task[0] : row.task;
    return task ? [task as TaskOnAssetSummary] : [];
  });
}
