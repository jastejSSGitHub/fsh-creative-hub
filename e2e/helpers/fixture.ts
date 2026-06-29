import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

export const E2E_USER_A_EMAIL = "e2e-user-a@fshdesign.local";
export const E2E_USER_B_EMAIL = "e2e-user-b@fshdesign.local";
export const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2e-test-password-local";

export type E2EFixture = {
  projectId: string;
  projectName: string;
  boardId: string;
  initiativeId: string;
  assetId: string;
  assetName: string;
  userAId: string;
  userBId: string;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for E2E.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureUser(email: string, displayName: string) {
  const admin = adminClient();
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = listed?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: E2E_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: E2E_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: displayName },
  });
  if (error || !data.user) throw error ?? new Error(`Failed to create ${email}`);
  return data.user.id;
}

async function ensureMember(projectId: string, userId: string, role: "admin" | "editor") {
  const admin = adminClient();
  await admin.from("hub_project_members").upsert(
    { project_id: projectId, user_id: userId, role },
    { onConflict: "project_id,user_id" },
  );
}

export async function ensureCollaborationFixture(): Promise<E2EFixture> {
  const admin = adminClient();
  const userAId = await ensureUser(E2E_USER_A_EMAIL, "E2E User A");
  const userBId = await ensureUser(E2E_USER_B_EMAIL, "E2E User B");

  const projectName = "E2E Collaboration Loop";
  const { data: existingProject } = await admin
    .from("hub_projects")
    .select("id")
    .eq("name", projectName)
    .maybeSingle();

  let projectId = existingProject?.id as string | undefined;

  if (!projectId) {
    const { data: project, error } = await admin
      .from("hub_projects")
      .insert({ name: projectName, created_by: userAId, is_org_wide: false })
      .select("id")
      .single();
    if (error || !project) throw error ?? new Error("Failed to create E2E project");
    projectId = project.id;
  }

  if (!projectId) {
    throw new Error("E2E fixture: projectId missing");
  }

  await ensureMember(projectId, userAId, "admin");
  await ensureMember(projectId, userBId, "editor");

  const { data: board } = await admin
    .from("hub_project_files")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", "review_board")
    .limit(1)
    .maybeSingle();

  let boardId = board?.id as string | undefined;
  if (!boardId) {
    const { data: createdBoard, error } = await admin
      .from("hub_project_files")
      .insert({
        project_id: projectId,
        type: "review_board",
        name: "Review board",
        created_by: userAId,
      })
      .select("id")
      .single();
    if (error || !createdBoard) throw error;
    boardId = createdBoard.id;
  }

  const { data: initiative } = await admin
    .from("hub_initiatives")
    .select("id")
    .eq("project_id", projectId)
    .eq("review_board_id", boardId)
    .limit(1)
    .maybeSingle();

  let initiativeId = initiative?.id as string | undefined;
  if (!initiativeId) {
    const { data: createdInitiative, error } = await admin
      .from("hub_initiatives")
      .insert({
        project_id: projectId,
        review_board_id: boardId,
        name: "Hero shots",
        sort_order: 0,
      })
      .select("id")
      .single();
    if (error || !createdInitiative) throw error;
    initiativeId = createdInitiative.id;
  }

  const assetName = "E2E test asset";
  const { data: asset } = await admin
    .from("hub_assets")
    .select("id")
    .eq("initiative_id", initiativeId)
    .eq("name", assetName)
    .maybeSingle();

  let assetId = asset?.id as string | undefined;
  if (!assetId) {
    const placeholder =
      "https://rnyeonvbnrwephpviyzu.supabase.co/storage/v1/object/public/hub-media/e2e/placeholder.jpg";
    const { data: createdAsset, error } = await admin
      .from("hub_assets")
      .insert({
        initiative_id: initiativeId,
        name: assetName,
        type: "image",
        storage_path: "e2e/placeholder.jpg",
        public_url: placeholder,
        tag: "v1",
        status: "approved",
        uploaded_by: userAId,
        sort_order: 0,
      })
      .select("id")
      .single();
    if (error || !createdAsset) throw error;
    assetId = createdAsset.id;
  }

  if (!boardId || !initiativeId || !assetId) {
    throw new Error("E2E fixture: board, initiative, or asset missing");
  }

  return {
    projectId,
    projectName,
    boardId,
    initiativeId,
    assetId,
    assetName,
    userAId,
    userBId,
  };
}

export async function linkTaskToAsset(taskId: string, assetId: string, userId: string) {
  const admin = adminClient();
  await admin.from("hub_task_assets").upsert(
    { task_id: taskId, asset_id: assetId, created_by: userId },
    { onConflict: "task_id,asset_id" },
  );
}

export async function getTaskIdByName(name: string, userId: string) {
  const admin = adminClient();
  const { data } = await admin
    .from("hub_tasks")
    .select("id")
    .eq("name", name)
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id as string | undefined;
}

export async function getTaskProjectId(taskId: string) {
  const admin = adminClient();
  const { data } = await admin
    .from("hub_tasks")
    .select("project_id")
    .eq("id", taskId)
    .maybeSingle();
  return data?.project_id as string | null | undefined;
}

export async function cleanupE2EComments(assetId: string) {
  const admin = adminClient();
  await admin.from("hub_comments").delete().eq("asset_id", assetId);
}

export async function cleanupE2ETasks(namePrefix: string) {
  const admin = adminClient();
  await admin.from("hub_tasks").delete().ilike("name", `${namePrefix}%`);
}
