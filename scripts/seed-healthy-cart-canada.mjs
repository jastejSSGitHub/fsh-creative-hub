/**
 * Seeds Healthy Cart Canada project with text doc + open canvas.
 *
 * Usage (from fsh-creative-hub):
 *   node scripts/seed-healthy-cart-canada.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const PROJECT_NAME = "Healthy Cart Canada";
const DOC_NAME = "Healthy Cart Canada Branding Guidelines + Logos";
const CANVAS_NAME = "Healthy Cart Canada Open Canvas";
const OWNER_EMAIL = "jas@fshdesign.org";

const PITCH_DECK_URL = "https://healthycart-pitch-deck.vercel.app/";
const DECK_DELTA_URL = "https://healthycart-pitch-deck.vercel.app/review/";
const GITHUB_URL = "https://github.com/jastejSSGitHub/Healthycart-FSH-pitch-deck.git";
const BRAND_WEBSITE_URL = "https://healthycartcanada.com";
const LOGO_SOURCE_URL =
  "https://healthycart-pitch-deck.vercel.app/assets/images/ui/logo.png";

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

function uuid() {
  return crypto.randomUUID();
}

function buildTextDocumentConfig() {
  const blocks = [
    {
      id: uuid(),
      type: "heading2",
      content: "Investor Pitch Deck:",
    },
    {
      id: uuid(),
      type: "webEmbed",
      content: "healthycart-pitch-deck.vercel.app",
      meta: {
        embedUrl: PITCH_DECK_URL,
        embedHeight: 560,
      },
    },
    {
      id: uuid(),
      type: "heading1",
      content: "Deck Delta:",
    },
    {
      id: uuid(),
      type: "webEmbed",
      content: "healthycart-pitch-deck.vercel.app",
      meta: {
        embedUrl: DECK_DELTA_URL,
        embedHeight: 560,
      },
    },
    {
      id: uuid(),
      type: "heading1",
      content: "Resources:",
    },
    {
      id: uuid(),
      type: "table",
      content: "",
      meta: {
        tableRows: [
          ["Title", "Resources"],
          ["1. Investor Pitch Deck", PITCH_DECK_URL],
          ["2. Deck Delta", DECK_DELTA_URL],
          ["3. GitHub Repo", GITHUB_URL],
          ["4. Brand Website", BRAND_WEBSITE_URL],
        ],
        tableColumnWidths: [33.333333333333336, 33.333333333333336, 33.333333333333336],
      },
    },
  ];

  return {
    version: 1,
    icon: "📄",
    cover: { kind: "image", value: "forest-path", position: 42 },
    blocks,
    plainTextPreview: [
      DOC_NAME,
      "Investor Pitch Deck:",
      "Deck Delta:",
      "Resources:",
      PITCH_DECK_URL,
      DECK_DELTA_URL,
    ].join("\n"),
  };
}

function buildCanvasConfig(logoPublicUrl) {
  return {
    version: 1,
    nodes: [
      {
        id: `text-${uuid()}`,
        type: "text",
        x: -480,
        y: -360,
        width: 520,
        height: 72,
        text: "Healthy Cart Canada Logo",
        color: "#ffffff",
        fontFamily: "geist-sans",
        textSize: "extra-large",
        letterSpacing: "normal",
        lineHeight: "normal",
        align: "left",
        bold: true,
        italic: false,
        underline: false,
        uppercase: false,
        lowercase: false,
      },
      {
        id: `image-${uuid()}`,
        type: "image",
        x: -480,
        y: -260,
        width: 320,
        height: 120,
        imageUrl: logoPublicUrl,
        naturalWidth: 800,
        naturalHeight: 300,
      },
      {
        id: `text-${uuid()}`,
        type: "text",
        x: 120,
        y: -360,
        width: 480,
        height: 72,
        text: "Investor Pitch Deck",
        color: "#ffffff",
        fontFamily: "geist-sans",
        textSize: "extra-large",
        letterSpacing: "normal",
        lineHeight: "normal",
        align: "center",
        bold: true,
        italic: false,
        underline: false,
        uppercase: false,
        lowercase: false,
      },
      {
        id: `text-${uuid()}`,
        type: "text",
        x: 120,
        y: -300,
        width: 480,
        height: 44,
        text: "Live investor briefing deck on Vercel",
        color: "#86efac",
        fontFamily: "geist-sans",
        textSize: "medium",
        letterSpacing: "normal",
        lineHeight: "normal",
        align: "center",
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        lowercase: false,
      },
      {
        id: `embed-${uuid()}`,
        type: "embed",
        x: 80,
        y: -220,
        width: 560,
        height: 720,
        embedUrl: PITCH_DECK_URL,
        label: "healthycart-pitch-deck.vercel.app",
      },
      {
        id: `text-${uuid()}`,
        type: "text",
        x: 760,
        y: -360,
        width: 480,
        height: 72,
        text: "Deck Delta",
        color: "#ffffff",
        fontFamily: "geist-sans",
        textSize: "extra-large",
        letterSpacing: "normal",
        lineHeight: "normal",
        align: "center",
        bold: true,
        italic: false,
        underline: false,
        uppercase: false,
        lowercase: false,
      },
      {
        id: `text-${uuid()}`,
        type: "text",
        x: 760,
        y: -300,
        width: 480,
        height: 44,
        text: "Slide-by-slide deck review & change log",
        color: "#86efac",
        fontFamily: "geist-sans",
        textSize: "medium",
        letterSpacing: "normal",
        lineHeight: "normal",
        align: "center",
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        lowercase: false,
      },
      {
        id: `embed-${uuid()}`,
        type: "embed",
        x: 720,
        y: -220,
        width: 560,
        height: 720,
        embedUrl: DECK_DELTA_URL,
        label: "healthycart-pitch-deck.vercel.app",
      },
    ],
    viewport: { x: 420, y: 380, zoom: 0.45 },
    backgroundColor: "#1a1a1a",
    onboardingCompleted: true,
    zoomTipsSeen: true,
  };
}

async function getOwner() {
  const { data, error } = await hub
    .from("hub_profiles")
    .select("id, email, display_name")
    .eq("email", OWNER_EMAIL)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Owner ${OWNER_EMAIL} not found. Sign in to Creative Hub first.`);
  }

  return data;
}

async function findOrCreateProject(ownerId) {
  const { data: existingByName } = await hub
    .from("hub_projects")
    .select("id, name")
    .eq("name", PROJECT_NAME)
    .maybeSingle();

  if (existingByName) return existingByName;

  const { data: legacyName } = await hub
    .from("hub_projects")
    .select("id, name")
    .ilike("name", "healthycart%")
    .maybeSingle();

  if (legacyName) {
    const { error } = await hub
      .from("hub_projects")
      .update({
        name: PROJECT_NAME,
        description: "Healthy Cart Canada — pitch deck, deck delta, and brand resources",
        cover_url: `${SITE_URL}/media/projects_thumbnails/healthy-cart-canada.png`,
      })
      .eq("id", legacyName.id);

    if (error) throw error;
    return { id: legacyName.id, name: PROJECT_NAME };
  }

  const { data: project, error } = await hub
    .from("hub_projects")
    .insert({
      name: PROJECT_NAME,
      description: "Healthy Cart Canada — pitch deck, deck delta, and brand resources",
      cover_url: `${SITE_URL}/media/projects_thumbnails/healthy-cart-canada.png`,
      created_by: ownerId,
    })
    .select("id, name")
    .single();

  if (error || !project) throw error ?? new Error("Could not create project.");
  return project;
}

const ORG_WIDE_PROJECT_NAMES = ["Blenz", "Healthy Cart Canada"];

function isOrgWideProjectName(name) {
  const normalized = name.trim().toLowerCase();
  return ORG_WIDE_PROJECT_NAMES.some(
    (projectName) => projectName.toLowerCase() === normalized,
  );
}

async function markProjectOrgWide(projectId, projectName) {
  if (!isOrgWideProjectName(projectName)) return;

  const { error } = await hub
    .from("hub_projects")
    .update({ is_org_wide: true })
    .eq("id", projectId);

  if (error) throw error;

  const { error: syncError } = await hub.rpc("hub_sync_org_wide_project_members", {
    p_project_id: projectId,
  });

  if (syncError) {
    console.warn("Org-wide member sync:", syncError.message);
  }
}

async function ensureTextDocument(projectId, ownerId) {
  const { data: existing } = await hub
    .from("hub_project_files")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", "text_document")
    .eq("name", DOC_NAME)
    .maybeSingle();

  const config = buildTextDocumentConfig();

  if (existing) {
    const { error } = await hub
      .from("hub_project_files")
      .update({ config })
      .eq("id", existing.id);
    if (error) throw error;
    console.log("Updated text document:", existing.id);
    return existing.id;
  }

  const { data: doc, error } = await hub
    .from("hub_project_files")
    .insert({
      project_id: projectId,
      type: "text_document",
      name: DOC_NAME,
      config,
      created_by: ownerId,
    })
    .select("id")
    .single();

  if (error || !doc) throw error ?? new Error("Could not create text document.");
  console.log("Created text document:", doc.id);
  return doc.id;
}

async function uploadLogo(projectId, canvasId) {
  const response = await fetch(LOGO_SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to download logo: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const storagePath = `${projectId}/canvas/${canvasId}/images/healthy-cart-logo.png`;

  const { error: uploadError } = await hub.storage
    .from("hub-media")
    .upload(storagePath, buffer, { contentType: "image/png", upsert: true });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = hub.storage.from("hub-media").getPublicUrl(storagePath);

  return { publicUrl, storagePath };
}

async function ensureCanvas(projectId, ownerId) {
  const { data: existing } = await hub
    .from("hub_project_files")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", "canvas")
    .eq("name", CANVAS_NAME)
    .maybeSingle();

  let canvasId = existing?.id;

  if (!canvasId) {
    const { data: canvas, error } = await hub
      .from("hub_project_files")
      .insert({
        project_id: projectId,
        type: "canvas",
        name: CANVAS_NAME,
        config: {
          version: 1,
          nodes: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          backgroundColor: "#1a1a1a",
        },
        created_by: ownerId,
      })
      .select("id")
      .single();

    if (error || !canvas) throw error ?? new Error("Could not create canvas.");
    canvasId = canvas.id;
    console.log("Created canvas:", canvasId);
  } else {
    console.log("Reusing canvas:", canvasId);
  }

  const { publicUrl, storagePath } = await uploadLogo(projectId, canvasId);
  const config = buildCanvasConfig(publicUrl);

  const imageNode = config.nodes.find((node) => node.type === "image");
  if (imageNode) {
    imageNode.storagePath = storagePath;
  }

  const { error: updateError } = await hub
    .from("hub_project_files")
    .update({ config })
    .eq("id", canvasId);

  if (updateError) throw updateError;
  console.log("Updated canvas with embeds + logo.");
  return canvasId;
}

async function logActivity(projectId, ownerId, summary, targetId) {
  await hub.from("hub_activity").insert({
    project_id: projectId,
    actor_id: ownerId,
    verb: "uploaded",
    target_type: "initiative",
    target_id: targetId,
    summary,
  });
}

async function main() {
  const owner = await getOwner();
  console.log("Owner:", owner.email);

  const project = await findOrCreateProject(owner.id);
  console.log("Project:", project.name, project.id);

  await markProjectOrgWide(project.id, project.name);

  const docId = await ensureTextDocument(project.id, owner.id);
  const canvasId = await ensureCanvas(project.id, owner.id);

  await logActivity(
    project.id,
    owner.id,
    `Created text document "${DOC_NAME}"`,
    docId,
  );
  await logActivity(
    project.id,
    owner.id,
    `Created open canvas "${CANVAS_NAME}"`,
    canvasId,
  );

  const projectUrl = `${SITE_URL}/projects/${project.id}`;
  const docUrl = `${SITE_URL}/projects/${project.id}/docs/${docId}`;
  const canvasUrl = `${SITE_URL}/projects/${project.id}/canvas/${canvasId}`;

  console.log("\nHealthy Cart Canada project is ready.\n");
  console.log(`Project:  ${projectUrl}`);
  console.log(`Text doc: ${docUrl}`);
  console.log(`Canvas:   ${canvasUrl}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
