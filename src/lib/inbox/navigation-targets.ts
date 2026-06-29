import { resolveProjectCoverUrl } from "@/lib/projects/project-thumbnails";
import {
  assetPath,
  projectPath,
  taskDeepLinkPath,
} from "@/lib/routes";
import type { ForYouItem } from "@/lib/inbox/queries";

export type ForYouNavigationTarget = {
  id: string;
  label: string;
  thumbnailUrl: string | null;
  href: string;
  ctaLabel: string;
  kind: "project" | "initiative" | "asset" | "task";
};

export function forYouPrimaryTitle(item: ForYouItem): string {
  if ("task" in item) return item.task.name;
  if ("asset" in item) return item.asset.name;
  return "For you";
}

export function forYouPreviewBody(item: ForYouItem): string | null {
  if ("comment" in item && item.comment.body) {
    return item.comment.body;
  }
  return null;
}

export function buildForYouNavigationTargets(
  item: ForYouItem,
): ForYouNavigationTarget[] {
  if ("initiative" in item && "project" in item && "asset" in item) {
    const assetThumb =
      "public_url" in item.asset ? (item.asset.public_url ?? null) : null;
    const projectThumb = resolveProjectCoverUrl(item.project.name, null);
    const commentId =
      "comment" in item && "id" in item.comment ? item.comment.id : null;

    const assetHref = commentId
      ? `${assetPath(item.project.id, item.initiative.id, item.asset.id)}?comment=${encodeURIComponent(commentId)}`
      : assetPath(item.project.id, item.initiative.id, item.asset.id);

    const initiativeHref = `${projectPath(item.project.id)}?initiative=${encodeURIComponent(item.initiative.id)}&asset=${encodeURIComponent(item.asset.id)}`;

    return [
      {
        id: `project-${item.project.id}`,
        label: item.project.name,
        thumbnailUrl: projectThumb,
        href: projectPath(item.project.id),
        ctaLabel: "Go to project",
        kind: "project",
      },
      {
        id: `initiative-${item.initiative.id}`,
        label: item.initiative.name,
        thumbnailUrl: assetThumb,
        href: initiativeHref,
        ctaLabel: "Go to document",
        kind: "initiative",
      },
      {
        id: `asset-${item.asset.id}`,
        label: item.asset.name,
        thumbnailUrl: assetThumb,
        href: assetHref,
        ctaLabel: "Go to asset",
        kind: "asset",
      },
    ];
  }

  if ("project" in item && item.project && "task" in item) {
    const projectThumb = resolveProjectCoverUrl(item.project.name, null);

    return [
      {
        id: `project-${item.project.id}`,
        label: item.project.name,
        thumbnailUrl: projectThumb,
        href: projectPath(item.project.id),
        ctaLabel: "Go to project",
        kind: "project",
      },
      {
        id: `task-${item.task.id}`,
        label: item.task.name,
        thumbnailUrl: projectThumb,
        href: taskDeepLinkPath(item.task.id, item.task.project_id ?? null),
        ctaLabel: "Go to task",
        kind: "task",
      },
    ];
  }

  if ("task" in item) {
    return [
      {
        id: `task-${item.task.id}`,
        label: item.task.name,
        thumbnailUrl: null,
        href: taskDeepLinkPath(item.task.id, item.task.project_id ?? null),
        ctaLabel: "Go to task",
        kind: "task",
      },
    ];
  }

  return [];
}
