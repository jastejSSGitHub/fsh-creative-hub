import { TEAM_LABEL_SLUGS } from "@/lib/tasks/constants";

export const TEAM_LABEL_COLORS: Record<(typeof TEAM_LABEL_SLUGS)[number], string> = {
  design: "#7c3aed",
  marketing: "#db2777",
  tech: "#0891b2",
  print: "#ca8a04",
  backend: "#2563eb",
  urgent: "#dc2626",
  quick: "#16a34a",
  waiting: "#9333ea",
  client: "#ea580c",
  internal: "#64748b",
};

const FALLBACK_COLOR = "#64748b";

export function getTeamLabelColor(name: string): string {
  const slug = name.toLowerCase() as (typeof TEAM_LABEL_SLUGS)[number];
  return TEAM_LABEL_COLORS[slug] ?? FALLBACK_COLOR;
}

export function isTeamLabel(name: string): boolean {
  return (TEAM_LABEL_SLUGS as readonly string[]).includes(name.toLowerCase());
}

export function teamAddTaskPlaceholder(labelName: string): string {
  return `What needs doing? @${labelName}`;
}
