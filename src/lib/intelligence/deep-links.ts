import {
  assetPath,
  canvasPath,
  projectTasksPath,
  reviewBoardPath,
  taskDeepLinkPath,
  textDocumentPath,
} from "@/lib/routes";
import type { HubProjectFileType } from "@/types/database";

export function canvasNodeHref(
  projectId: string,
  canvasId: string,
  nodeId: string,
): string {
  return `${canvasPath(projectId, canvasId)}?node=${encodeURIComponent(nodeId)}`;
}

export function textDocumentBlockHref(
  projectId: string,
  docId: string,
  blockId: string,
): string {
  return `${textDocumentPath(projectId, docId)}?block=${encodeURIComponent(blockId)}`;
}

export function projectFileHref(
  projectId: string,
  fileId: string,
  fileType: HubProjectFileType,
): string {
  switch (fileType) {
    case "review_board":
      return reviewBoardPath(projectId, fileId);
    case "canvas":
      return canvasPath(projectId, fileId);
    case "text_document":
      return textDocumentPath(projectId, fileId);
  }
}

export function taskHref(projectId: string | null, taskId: string): string {
  return taskDeepLinkPath(taskId, projectId);
}

export function assetHref(
  projectId: string,
  initiativeId: string,
  assetId: string,
): string {
  return assetPath(projectId, initiativeId, assetId);
}

export function projectTasksHref(projectId: string): string {
  return projectTasksPath(projectId);
}
