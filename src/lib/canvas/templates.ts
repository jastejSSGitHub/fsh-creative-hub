import type { CanvasNode, SectionNode } from "@/lib/canvas/types";

function id(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** FigJam-style "How might we" brainstorm template centered at world origin. */
export function createHowMightWeTemplate(): CanvasNode[] {
  const section: SectionNode = {
    id: id("section"),
    type: "section",
    x: -420,
    y: -280,
    width: 840,
    height: 560,
    title: "How might we _________?",
    subtitle: "Ideas here",
    accentColor: "#18a0fb",
    fillColor: "#dbeafe",
    templateId: "how-might-we",
  };

  return [section];
}
