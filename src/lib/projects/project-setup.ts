import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteOrphanProject(projectId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("hub_projects").delete().eq("id", projectId);
  } catch {
    // Best-effort cleanup when a multi-step project setup fails.
  }
}
