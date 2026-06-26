/**
 * One-time migration: Blenz review board → FSH Creative Hub
 *
 * Usage (from fsh-creative-hub):
 *   $env:BLENZ_LEGACY_SERVICE_ROLE_KEY="..." ; node scripts/migrate-blenz.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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
const LEGACY_URL = "https://hrkdjshgoeambbovxmuk.supabase.co";
const LEGACY_SERVICE_KEY = process.env.BLENZ_LEGACY_SERVICE_ROLE_KEY;

if (!HUB_URL || !HUB_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!LEGACY_SERVICE_KEY) {
  console.error("Set BLENZ_LEGACY_SERVICE_ROLE_KEY for the old Blenz Supabase project.");
  process.exit(1);
}

const hub = createClient(HUB_URL, HUB_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const legacy = createClient(LEGACY_URL, LEGACY_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const POSTER_FOLDER = "refreshing-graphics";
const MENU_FOLDER = "refreshing-menus";
const VIDEO_FOLDER = "videos";
const EXCLUDE_VIDEOS = ["fuel-vibe.mp4"];

const VARIANT_OVERRIDES = { "collage (1).png": "collage-b(dot).png" };
const STANDALONE_BDOT = ["chill-your-way-b(dot).png"];

function slugify(filename) {
  return filename.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function fileToName(filename) {
  return filename
    .replace(/^\d+[-_]/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fileToTag(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes("collage")) return "Collage";
  if (lower.includes("menu")) return "Menu Board";
  if (lower.endsWith(".mp4") || lower.endsWith(".webm")) return "Video";
  if (lower.includes("grid") || lower.includes("lineup")) return "Group Lineup";
  return "Marketing Poster";
}

function isFix(filename) {
  return filename.toLowerCase().startsWith("fix-");
}

function isBdot(filename) {
  const lower = filename.toLowerCase();
  return lower.includes("b(dot)") || lower.includes("bdot") || lower.includes("b-dot");
}

function isStandaloneBdot(filename) {
  return STANDALONE_BDOT.includes(filename);
}

function formatLegacyApprover(votedBy, status) {
  if (!votedBy || status !== "approved") return null;
  const lower = votedBy.toLowerCase().trim();
  if (lower === "sandeep" || lower === "san") return "Sandeep Alexander";
  return votedBy;
}

async function listLegacyFolder(folder) {
  const { data, error } = await legacy.storage.from("graphics").list(folder, {
    limit: 500,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) {
    console.warn(`List ${folder}:`, error.message);
    return [];
  }
  return (data ?? []).filter((item) => item.name && !item.id?.endsWith?.("/"));
}

async function downloadLegacyFile(folder, filename) {
  const path = `${folder}/${filename}`;
  const { data, error } = await legacy.storage.from("graphics").download(path);
  if (error) throw new Error(`Download failed ${path}: ${error.message}`);
  return { buffer: Buffer.from(await data.arrayBuffer()), path };
}

async function getReviewState() {
  const { data, error } = await legacy
    .from("blenz_review_items")
    .select("slug,status,voted_by,note");
  if (error) throw error;
  const map = new Map();
  for (const row of data ?? []) {
    map.set(row.slug, row);
  }
  return map;
}

async function ensureAllProfilesAreMembers(projectId) {
  const { data: profiles } = await hub.from("hub_profiles").select("id");
  for (const profile of profiles ?? []) {
    await hub.from("hub_project_members").upsert(
      { project_id: projectId, user_id: profile.id, role: "admin" },
      { onConflict: "project_id,user_id" },
    );
  }
}

async function ensureBlenzProject(ownerId) {
  const { data: existing } = await hub
    .from("hub_projects")
    .select("id")
    .eq("name", "Blenz")
    .maybeSingle();

  if (existing) {
    console.log("Project Blenz already exists:", existing.id);
    await ensureAllProfilesAreMembers(existing.id);
    return existing.id;
  }

  const { data: project, error } = await hub
    .from("hub_projects")
    .insert({
      name: "Blenz",
      description: "Coffee branding creative review — migrated from Blenz review board",
      created_by: ownerId,
    })
    .select("id")
    .single();

  if (error) throw error;

  await hub.from("hub_project_members").insert({
    project_id: project.id,
    user_id: ownerId,
    role: "admin",
  });
  await ensureAllProfilesAreMembers(project.id);

  console.log("Created project Blenz:", project.id);
  return project.id;
}

async function ensureReviewBoard(projectId, ownerId) {
  const { data: existing } = await hub
    .from("hub_project_files")
    .select("id")
    .eq("project_id", projectId)
    .eq("name", "Marketing Creative Review")
    .maybeSingle();

  if (existing) {
    console.log("Review board already exists:", existing.id);
    const { data: initiatives } = await hub
      .from("hub_initiatives")
      .select("id, name")
      .eq("review_board_id", existing.id);
    return { boardId: existing.id, initiatives: initiatives ?? [] };
  }

  const { data: board, error: boardError } = await hub
    .from("hub_project_files")
    .insert({
      project_id: projectId,
      type: "review_board",
      name: "Marketing Creative Review",
      config: {
        sections: [
          { preset: "graphics" },
          { preset: "menus" },
          { preset: "videos" },
        ],
      },
      created_by: ownerId,
    })
    .select("id")
    .single();

  if (boardError) throw boardError;

  const sectionNames = [
    { name: "Marketing Visuals", sort: 0 },
    { name: "Menus", sort: 1 },
    { name: "Video Assets", sort: 2 },
  ];

  const { data: initiatives, error: initError } = await hub
    .from("hub_initiatives")
    .insert(
      sectionNames.map((s) => ({
        project_id: projectId,
        review_board_id: board.id,
        name: s.name,
        sort_order: s.sort,
      })),
    )
    .select("id, name");

  if (initError) throw initError;

  console.log("Created review board:", board.id);
  return { boardId: board.id, initiatives: initiatives ?? [] };
}

function initiativeForFolder(initiatives, folder) {
  if (folder === POSTER_FOLDER) {
    return initiatives.find((i) => i.name === "Marketing Visuals");
  }
  if (folder === MENU_FOLDER) {
    return initiatives.find((i) => i.name === "Menus");
  }
  if (folder === VIDEO_FOLDER) {
    return initiatives.find((i) => i.name === "Video Assets");
  }
  return null;
}

async function migrateAsset({
  projectId,
  boardId,
  initiativeId,
  ownerId,
  folder,
  filename,
  reviewState,
  variantOf = null,
}) {
  const slug = slugify(filename);
  const review = reviewState.get(slug);
  const status = review?.status === "approved" || review?.status === "rejected"
    ? review.status
    : "pending";

  const { data: existing } = await hub
    .from("hub_assets")
    .select("id")
    .eq("initiative_id", initiativeId)
    .eq("storage_path", `${projectId}/${boardId}/${initiativeId}/${filename}`)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { buffer } = await downloadLegacyFile(folder, filename);
  const storagePath = `${projectId}/${boardId}/${initiativeId}/${filename}`;
  const contentType = filename.toLowerCase().endsWith(".mp4")
    ? "video/mp4"
    : filename.toLowerCase().endsWith(".webm")
      ? "video/webm"
      : "image/png";

  const { error: uploadError } = await hub.storage
    .from("hub-media")
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = hub.storage.from("hub-media").getPublicUrl(storagePath);

  const { data: asset, error: assetError } = await hub
    .from("hub_assets")
    .insert({
      initiative_id: initiativeId,
      name: fileToName(filename),
      type: contentType.startsWith("video") ? "video" : "image",
      storage_path: storagePath,
      public_url: publicUrl,
      tag: fileToTag(filename),
      status,
      uploaded_by: ownerId,
      is_fix_candidate: isFix(filename),
      legacy_approved_by: formatLegacyApprover(review?.voted_by, status),
      variant_of: variantOf,
    })
    .select("id")
    .single();

  if (assetError) throw assetError;

  if (review?.note) {
    await hub.from("hub_comments").insert({
      asset_id: asset.id,
      author_id: ownerId,
      body: review.note,
    });
  }

  return asset.id;
}

async function migratePosters(projectId, boardId, initiatives, ownerId, reviewState) {
  const initiative = initiativeForFolder(initiatives, POSTER_FOLDER);
  if (!initiative) return;

  const files = await listLegacyFolder(POSTER_FOLDER);
  const names = files.map((f) => f.name);
  const variantMap = {};

  for (const name of names) {
    if (isBdot(name) && !isStandaloneBdot(name)) {
      const base = name
        .replace(/-b\(dot\)/i, "")
        .replace(/-bdot/i, "")
        .replace(/-b-dot/i, "");
      variantMap[base] = name;
    }
  }
  Object.assign(variantMap, VARIANT_OVERRIDES);

  let count = 0;
  for (const file of files) {
    const filename = file.name;
    if (isBdot(filename) && !isStandaloneBdot(filename)) continue;

    const baseId = await migrateAsset({
      projectId,
      boardId,
      initiativeId: initiative.id,
      ownerId,
      folder: POSTER_FOLDER,
      filename,
      reviewState,
    });

    const variantFile = variantMap[filename];
    if (variantFile && names.includes(variantFile)) {
      await migrateAsset({
        projectId,
        boardId,
        initiativeId: initiative.id,
        ownerId,
        folder: POSTER_FOLDER,
        filename: variantFile,
        reviewState,
        variantOf: baseId,
      });
    }
    count++;
    process.stdout.write(`\r  Posters: ${count}/${files.length}`);
  }
  console.log();
}

async function migrateMenus(projectId, boardId, initiatives, ownerId, reviewState) {
  let initiative = initiativeForFolder(initiatives, MENU_FOLDER);
  let folder = MENU_FOLDER;
  let files = await listLegacyFolder(MENU_FOLDER);

  if (!files.length) {
    files = (await listLegacyFolder(POSTER_FOLDER)).filter((f) =>
      f.name.toLowerCase().startsWith("menu"),
    );
    folder = POSTER_FOLDER;
    initiative = initiativeForFolder(initiatives, MENU_FOLDER);
  }

  if (!initiative) return;

  let count = 0;
  for (const file of files) {
    if (file.name.includes("(")) continue;
    await migrateAsset({
      projectId,
      boardId,
      initiativeId: initiative.id,
      ownerId,
      folder,
      filename: file.name,
      reviewState,
    });
    count++;
    process.stdout.write(`\r  Menus: ${count}/${files.length}`);
  }
  console.log();
}

async function migrateVideos(projectId, boardId, initiatives, ownerId, reviewState) {
  const initiative = initiativeForFolder(initiatives, VIDEO_FOLDER);
  if (!initiative) return;

  const files = (await listLegacyFolder(VIDEO_FOLDER)).filter(
    (f) => !EXCLUDE_VIDEOS.includes(f.name.toLowerCase()),
  );

  let count = 0;
  for (const file of files) {
    await migrateAsset({
      projectId,
      boardId,
      initiativeId: initiative.id,
      ownerId,
      folder: VIDEO_FOLDER,
      filename: file.name,
      reviewState,
    });
    count++;
    process.stdout.write(`\r  Videos: ${count}/${files.length}`);
  }
  console.log();
}

async function main() {
  console.log("Fetching hub owner…");
  const { data: profiles, error: profileError } = await hub
    .from("hub_profiles")
    .select("id, email")
    .order("created_at", { ascending: true })
    .limit(1);

  if (profileError || !profiles?.length) {
    throw new Error("No hub_profiles found. Sign in to Creative Hub first.");
  }

  const ownerId = profiles[0].id;
  console.log("Owner:", profiles[0].email);

  const reviewState = await getReviewState();
  console.log(`Loaded ${reviewState.size} review records from legacy DB`);

  const projectId = await ensureBlenzProject(ownerId);
  const { boardId, initiatives } = await ensureReviewBoard(projectId, ownerId);

  console.log("Migrating assets…");
  await migratePosters(projectId, boardId, initiatives, ownerId, reviewState);
  await migrateMenus(projectId, boardId, initiatives, ownerId, reviewState);
  await migrateVideos(projectId, boardId, initiatives, ownerId, reviewState);

  const { count } = await hub
    .from("hub_assets")
    .select("id", { count: "exact", head: true })
    .in(
      "initiative_id",
      initiatives.map((i) => i.id),
    );

  console.log(`\nDone. ${count ?? 0} assets in Blenz review board.`);
  console.log(`Open: /projects/${projectId}/boards/${boardId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
