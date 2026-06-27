import type { SupabaseClient } from "@supabase/supabase-js";

import { parseCanvasConfig } from "@/lib/canvas/parse-config";
import { STICKY_HEIGHT, STICKY_WIDTH } from "@/lib/canvas/presets";
import type { CanvasConfigV1, StickyNode } from "@/lib/canvas/types";
import {
  normalizeIdeaTextSize,
  resolveIdeaStickyColor,
} from "@/lib/workspace/idea-sticky-colors";
import type { IdeaWithMeta } from "@/lib/workspace/queries";
import type { HubProjectFile } from "@/types/database";

export const IDEAS_CANVAS_BG = "#faf8f3";
export const IDEAS_CANVAS_TEMPLATE = "ideas-board";

function emptyIdeasCanvasConfig(): CanvasConfigV1 {
  return {
    version: 1,
    nodes: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    backgroundColor: IDEAS_CANVAS_BG,
    templateApplied: IDEAS_CANVAS_TEMPLATE,
    onboardingCompleted: true,
    zoomTipsSeen: true,
  };
}

function ideasToStickyNodes(ideas: IdeaWithMeta[]): StickyNode[] {
  const gap = 24;
  const colWidth = STICKY_WIDTH + gap;

  return ideas.map((idea, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);

    return {
      id: `sticky-${idea.id}`,
      type: "sticky",
      x: 48 + col * colWidth,
      y: 48 + row * (STICKY_HEIGHT + gap),
      width: idea.width ?? STICKY_WIDTH,
      height: idea.height ?? STICKY_HEIGHT,
      text: idea.body,
      color: resolveIdeaStickyColor(idea.color),
      textSize: normalizeIdeaTextSize(idea.text_size),
      bold: idea.bold ?? false,
      strikethrough: idea.strikethrough ?? false,
      authorName: idea.author.display_name,
    };
  });
}

export async function ensureInitiativeIdeasCanvas(
  supabase: SupabaseClient,
  projectId: string,
  initiativeId: string,
  initiativeName: string,
  userId: string,
  ideas: IdeaWithMeta[] = [],
): Promise<HubProjectFile | null> {
  const { data: initiative, error: initiativeError } = await supabase
    .from("hub_initiatives")
    .select("id, ideas_canvas_id, name")
    .eq("id", initiativeId)
    .maybeSingle();

  if (initiativeError || !initiative) return null;

  if (initiative.ideas_canvas_id) {
    const { data: existingCanvas } = await supabase
      .from("hub_project_files")
      .select("*")
      .eq("id", initiative.ideas_canvas_id)
      .eq("type", "canvas")
      .maybeSingle();

    if (existingCanvas) return existingCanvas as HubProjectFile;
  }

  const config = emptyIdeasCanvasConfig();
  if (ideas.length > 0) {
    config.nodes = ideasToStickyNodes(ideas);
  }

  const canvasName = `${initiativeName.trim() || initiative.name} — Ideas`;

  const { data: canvas, error: canvasError } = await supabase
    .from("hub_project_files")
    .insert({
      project_id: projectId,
      type: "canvas",
      name: canvasName,
      config,
      created_by: userId,
    })
    .select("*")
    .single();

  if (canvasError || !canvas) return null;

  await supabase
    .from("hub_initiatives")
    .update({ ideas_canvas_id: canvas.id })
    .eq("id", initiativeId);

  return canvas as HubProjectFile;
}

export function getIdeasCanvasStickyCount(canvas: HubProjectFile | null | undefined): number {
  if (!canvas) return 0;
  const parsed = parseCanvasConfig(canvas.config as Record<string, unknown> | undefined);
  return parsed.nodes.filter((node) => node.type === "sticky").length;
}
