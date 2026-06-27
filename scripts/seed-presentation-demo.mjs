/**
 * Seeds a demo project with local /public/media assets for presentation mode testing.
 *
 * Usage (from fsh-creative-hub):
 *   npm run seed:presentation-demo
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const DEMO_MARKER = "demo:presentation";
const DEMO_PROJECT_NAME = "Presentation Demo";
const DEMO_BOARD_NAME = "Spring Campaign Review";
const DEMO_SECTION = "Marketing Visuals";
const DEV_EMAIL = "dev@fshdesign.local";
const DEV_DISPLAY_NAME = "Jastej Sehra";

const DEMO_ASSETS = [
  {
    path: "/media/capabilities/brand-system/brand-1.png",
    name: "Hero Banner",
    tag: "Brand System",
    status: "final",
    type: "image",
  },
  {
    path: "/media/capabilities/presentation/presentation1.png",
    name: "Deck Slide 01",
    tag: "Presentation",
    status: "final",
    type: "image",
  },
  {
    path: "/media/capabilities/website/coffee-website.png",
    name: "Coffee Landing Page",
    tag: "Website",
    status: "approved",
    type: "image",
  },
  {
    path: "/media/capabilities/graphics/sutlej.png",
    name: "Sutlej Poster",
    tag: "Marketing Poster",
    status: "approved",
    type: "image",
  },
  {
    path: "/media/capabilities/film/td-video.mp4",
    name: "TD Brand Film",
    tag: "Video",
    status: "approved",
    type: "video",
  },
  {
    path: "/media/capabilities/presentation/presentation-video.mp4",
    name: "Campaign Reel",
    tag: "Video",
    status: "approved",
    type: "video",
  },
];

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const HUB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const HUB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010").replace(
  /\/$/,
  "",
);

if (!HUB_URL || !HUB_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const hub = createClient(HUB_URL, HUB_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function publicUrlForPath(mediaPath) {
  return `${SITE_URL}${mediaPath}`;
}

async function findDevUser() {
  const { data, error } = await hub.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  const user = data.users.find((entry) => entry.email?.toLowerCase() === DEV_EMAIL);
  if (!user) {
    throw new Error(
      `Dev user ${DEV_EMAIL} not found. Visit ${SITE_URL}/auth/dev-bypass once, then re-run.`,
    );
  }
  return user;
}

async function ensureProfile(userId, email, displayName) {
  const { error } = await hub.from("hub_profiles").upsert(
    {
      id: userId,
      email,
      display_name: displayName,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

async function findDemoProject(userId) {
  const { data, error } = await hub
    .from("hub_projects")
    .select("id, name, description")
    .eq("created_by", userId)
    .ilike("description", `%${DEMO_MARKER}%`)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function main() {
  const devUser = await findDevUser();
  const displayName =
    devUser.user_metadata?.full_name ??
    devUser.email?.split("@")[0] ??
    DEV_DISPLAY_NAME;

  await ensureProfile(devUser.id, devUser.email ?? DEV_EMAIL, displayName);

  let project = await findDemoProject(devUser.id);

  if (!project) {
    const { data, error } = await hub
      .from("hub_projects")
      .insert({
        name: DEMO_PROJECT_NAME,
        description: `${DEMO_MARKER} — local media demo for presentation mode`,
        cover_url: publicUrlForPath("/media/capabilities/presentation/presentation2.png"),
        created_by: devUser.id,
      })
      .select("id, name")
      .single();

    if (error || !data) throw error ?? new Error("Could not create demo project.");
    project = data;

    const { error: memberError } = await hub.from("hub_project_members").insert({
      project_id: project.id,
      user_id: devUser.id,
      role: "admin",
    });
    if (memberError) throw memberError;

    console.log("Created project:", project.name);
  } else {
    console.log("Reusing project:", project.name);
  }

  let boardId;
  const { data: existingBoard } = await hub
    .from("hub_project_files")
    .select("id")
    .eq("project_id", project.id)
    .eq("type", "review_board")
    .eq("name", DEMO_BOARD_NAME)
    .maybeSingle();

  if (existingBoard) {
    boardId = existingBoard.id;
    console.log("Reusing review board:", DEMO_BOARD_NAME);
  } else {
    const { data: board, error: boardError } = await hub
      .from("hub_project_files")
      .insert({
        project_id: project.id,
        type: "review_board",
        name: DEMO_BOARD_NAME,
        config: { demo: true },
        created_by: devUser.id,
      })
      .select("id")
      .single();

    if (boardError || !board) throw boardError ?? new Error("Could not create review board.");
    boardId = board.id;
    console.log("Created review board:", DEMO_BOARD_NAME);
  }

  let initiativeId;
  const { data: existingInitiative } = await hub
    .from("hub_initiatives")
    .select("id")
    .eq("review_board_id", boardId)
    .eq("name", DEMO_SECTION)
    .maybeSingle();

  if (existingInitiative) {
    initiativeId = existingInitiative.id;
    console.log("Reusing section:", DEMO_SECTION);

    const { error: deleteError } = await hub
      .from("hub_assets")
      .delete()
      .eq("initiative_id", initiativeId);
    if (deleteError) throw deleteError;
    console.log("Cleared previous demo assets.");
  } else {
    const { data: initiative, error: initiativeError } = await hub
      .from("hub_initiatives")
      .insert({
        project_id: project.id,
        review_board_id: boardId,
        name: DEMO_SECTION,
        sort_order: 0,
      })
      .select("id")
      .single();

    if (initiativeError || !initiative) {
      throw initiativeError ?? new Error("Could not create section.");
    }
    initiativeId = initiative.id;
    console.log("Created section:", DEMO_SECTION);
  }

  const assetRows = DEMO_ASSETS.map((asset, index) => ({
    initiative_id: initiativeId,
    name: asset.name,
    type: asset.type,
    storage_path: `demo/presentation${asset.path}`,
    public_url: publicUrlForPath(asset.path),
    tag: asset.tag,
    status: asset.status,
    uploaded_by: devUser.id,
    sort_order: index,
  }));

  const { data: insertedAssets, error: assetError } = await hub
    .from("hub_assets")
    .insert(assetRows)
    .select("id, name, status");

  if (assetError) throw assetError;

  const projectUrl = `${SITE_URL}/projects/${project.id}`;
  const boardUrl = `${SITE_URL}/projects/${project.id}/boards/${boardId}`;

  console.log("\nPresentation demo is ready.\n");
  console.log(`Assets seeded: ${insertedAssets?.length ?? 0}`);
  for (const asset of insertedAssets ?? []) {
    console.log(`  - ${asset.name} (${asset.status})`);
  }
  console.log("\nOpen in browser:");
  console.log(`  1. Sign in:  ${SITE_URL}/auth/dev-bypass`);
  console.log(`  2. Project:  ${projectUrl}`);
  console.log(`  3. Board:    ${boardUrl}`);
  console.log("\nThen click Present on the review board to test fullscreen mode.");
  console.log("Keyboard: Arrow keys / Space = next, Esc = exit. Swipe on mobile.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
