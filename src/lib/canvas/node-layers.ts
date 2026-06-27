import type { CanvasNode } from "@/lib/canvas/types";

export const CANVAS_Z = {
  section: 10,
  sticky: 20,
  text: 22,
  embed: 25,
  image: 28,
  stamp: 50,
  stampLayer: 50,
  embedGhost: 35,
  imageGhost: 38,
  stampGhost: 55,
  marquee: 60,
} as const;

export function isStampPlacementActive(
  placementTool: string,
  pendingStampId?: string | null,
) {
  return placementTool === "stamp" && Boolean(pendingStampId);
}

export function partitionCanvasNodes(nodes: CanvasNode[]) {
  const sections: CanvasNode[] = [];
  const stickies: CanvasNode[] = [];
  const texts: CanvasNode[] = [];
  const embeds: CanvasNode[] = [];
  const images: CanvasNode[] = [];
  const stamps: CanvasNode[] = [];

  for (const node of nodes) {
    if (node.type === "section") sections.push(node);
    else if (node.type === "sticky") stickies.push(node);
    else if (node.type === "text") texts.push(node);
    else if (node.type === "embed") embeds.push(node);
    else if (node.type === "image") images.push(node);
    else if (node.type === "stamp") stamps.push(node);
  }

  return { sections, stickies, texts, embeds, images, stamps };
}
