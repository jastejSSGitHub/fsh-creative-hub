import type { BriefItemKind } from "@/lib/intelligence/types";
import type { SearchResultKind } from "@/lib/search/queries";

export type HubContentNavigationKind =
  | "asset"
  | "document"
  | "canvas"
  | "review_board"
  | "task"
  | "project"
  | "generic";

export const HUB_CONTENT_NAVIGATION_STAGE_MS = 1_100;
export const HUB_CONTENT_NAVIGATION_MIN_VISIBLE_MS = 720;

const OPENING = [
  "Opening your asset…",
  "Opening your document…",
  "Opening the canvas…",
  "Opening the review board…",
  "Opening your task…",
  "Opening your project…",
  "Getting things ready…",
] as const;

const ASSET_MIDDLE = [
  "Loading the preview…",
  "Checking comments…",
  "Seeing review feedback…",
  "Pulling up annotations…",
] as const;

const DOCUMENT_MIDDLE = [
  "Loading your document…",
  "Gathering your content…",
  "Finding the right section…",
  "Scrolling to your placement…",
] as const;

const CANVAS_MIDDLE = [
  "Loading the canvas…",
  "Locating your placement…",
  "Gathering sticky notes…",
  "Finding that spot…",
] as const;

const REVIEW_MIDDLE = [
  "Loading assets and status…",
  "Checking review progress…",
  "Gathering thumbnails…",
] as const;

const TASK_MIDDLE = [
  "Loading task details…",
  "Checking due dates…",
  "Gathering context…",
] as const;

const PROJECT_MIDDLE = [
  "Gathering boards and files…",
  "Loading project files…",
  "Checking recent activity…",
] as const;

const GENERIC_MIDDLE = [
  "Loading content…",
  "Pulling things together…",
  "Almost ready…",
] as const;

const CLOSING = [
  "Almost there…",
  "One moment…",
  "Just a sec…",
] as const;

function pickOne<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function openingFor(kind: HubContentNavigationKind): string {
  switch (kind) {
    case "asset":
      return OPENING[0];
    case "document":
      return OPENING[1];
    case "canvas":
      return OPENING[2];
    case "review_board":
      return OPENING[3];
    case "task":
      return OPENING[4];
    case "project":
      return OPENING[5];
    default:
      return OPENING[6];
  }
}

function middleFor(kind: HubContentNavigationKind, href: string): string {
  const hasBlock = href.includes("block=");
  const hasNode = href.includes("node=");

  switch (kind) {
    case "asset":
      return pickOne(ASSET_MIDDLE);
    case "document":
      return hasBlock
        ? pickOne([
            "Finding the right section…",
            "Scrolling to your block…",
            "Locating that passage…",
          ])
        : pickOne(DOCUMENT_MIDDLE);
    case "canvas":
      return hasNode
        ? pickOne([
            "Locating your placement…",
            "Finding that canvas spot…",
            "Panning to your node…",
          ])
        : pickOne(CANVAS_MIDDLE);
    case "review_board":
      return pickOne(REVIEW_MIDDLE);
    case "task":
      return pickOne(TASK_MIDDLE);
    case "project":
      return pickOne(PROJECT_MIDDLE);
    default:
      return pickOne(GENERIC_MIDDLE);
  }
}

export function resolveHubContentNavigationStages(
  kind: HubContentNavigationKind,
  href: string,
): readonly [string, string, string] {
  return [openingFor(kind), middleFor(kind, href), pickOne(CLOSING)];
}

export function resolveHubContentNavigationKind(
  href: string,
  hint?: BriefItemKind | SearchResultKind | "file",
): HubContentNavigationKind {
  if (hint === "asset") return "asset";
  if (hint === "doc_block") return "document";
  if (hint === "canvas_node") return "canvas";
  if (hint === "task") return "task";
  if (hint === "project") return "project";

  if (href.includes("task=")) return "task";

  if (hint === "file") {
    if (href.includes("/boards/")) return "review_board";
    if (href.includes("/docs/")) return "document";
    if (href.includes("/canvas/")) return "canvas";
    return "generic";
  }

  const path = href.split("?")[0] ?? href;

  if (/\/i\/[^/]+\/a\/[^/]+$/.test(path)) return "asset";
  if (path.includes("/docs/")) return "document";
  if (path.includes("/canvas/")) return "canvas";
  if (path.includes("/boards/")) return "review_board";
  if (path.includes("/tasks")) return "task";
  if (/^\/projects\/[^/]+$/.test(path)) return "project";

  return "generic";
}

export function hubContentNavigationPathname(href: string): string {
  if (href.startsWith("http")) return href;
  return href.split("?")[0] ?? href;
}
