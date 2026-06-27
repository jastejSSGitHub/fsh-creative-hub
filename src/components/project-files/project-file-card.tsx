"use client";

import { ClipboardList, FileText, PenTool, Star } from "lucide-react";
import { ProjectFileThumbnail } from "@/components/project-files/project-file-thumbnail";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { formatEditedTime } from "@/lib/format-edited-time";
import { MemberAvatar } from "@/components/projects/member-avatar";
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import { parseDocumentConfig } from "@/lib/documents/types";
import {
  resolveDocumentCover,
  resolveDocumentIcon,
} from "@/lib/documents/defaults";
import { captureReviewBoardNavigationSnapshot } from "@/lib/projects/review-board-snapshot";
import { captureTextDocumentNavigationSnapshot } from "@/lib/projects/text-document-snapshot";
import { reviewBoardPath, canvasPath, textDocumentPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ProjectRouter = Pick<ReturnType<typeof useRouter>, "push" | "prefetch">;

export function navigateToProjectFile(
  router: ProjectRouter,
  projectId: string,
  file: ProjectFileWithMeta,
  options?: { newTab?: boolean; projectName?: string },
) {
  const href =
    file.type === "review_board"
      ? reviewBoardPath(projectId, file.id)
      : file.type === "canvas"
        ? canvasPath(projectId, file.id)
        : file.type === "text_document"
          ? textDocumentPath(projectId, file.id)
          : null;

  if (!href) return;

  if (file.type === "review_board") {
    captureReviewBoardNavigationSnapshot({
      projectId,
      boardId: file.id,
      projectName: options?.projectName ?? "Project",
      boardName: file.name,
      sectionCount: file.section_count,
      assetCount: file.asset_count,
    });
  }

  if (file.type === "text_document") {
    const config = parseDocumentConfig(file.config);
    captureTextDocumentNavigationSnapshot({
      projectId,
      docId: file.id,
      docName: file.name,
      icon: resolveDocumentIcon(config.icon, projectId, file.id),
      cover: resolveDocumentCover(config.cover, file.name, projectId, file.id),
    });
  }

  if (options?.newTab) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  router.prefetch(href);
  router.push(href);
}

type ProjectFileCardProps = {
  file: ProjectFileWithMeta;
  projectId: string;
  projectName: string;
  selected?: boolean;
  editorDisplayName?: string;
  editorAvatarUrl?: string | null;
  onSelect?: (fileId: string) => void;
  onFavoriteToggle?: (fileId: string, favorite: boolean) => void;
  onContextMenu: (file: ProjectFileWithMeta, x: number, y: number) => void;
};

export function ProjectFileCard({
  file,
  projectId,
  projectName,
  selected = false,
  editorDisplayName = "Unknown user",
  editorAvatarUrl,
  onSelect,
  onFavoriteToggle,
  onContextMenu,
}: ProjectFileCardProps) {
  const router = useRouter();
  const clickTimeoutRef = useRef<number | null>(null);
  const canOpen =
    file.type === "review_board" ||
    file.type === "canvas" ||
    file.type === "text_document";
  const href =
    file.type === "review_board"
      ? reviewBoardPath(projectId, file.id)
      : file.type === "canvas"
        ? canvasPath(projectId, file.id)
        : file.type === "text_document"
          ? textDocumentPath(projectId, file.id)
          : null;

  const Icon =
    file.type === "review_board"
      ? ClipboardList
      : file.type === "text_document"
        ? FileText
        : PenTool;
  const editedAt = file.created_at;

  const prefetchFile = useCallback(() => {
    if (!href) return;
    router.prefetch(href);
  }, [href, router]);

  function openFile(newTab = false) {
    if (!canOpen) return;
    navigateToProjectFile(router, projectId, file, { newTab, projectName });
  }

  function handleFavoriteToggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onFavoriteToggle?.(file.id, !file.isFavorite);
  }

  function showContextMenu(event: React.MouseEvent) {
    if (!canOpen) return;
    event.preventDefault();
    onSelect?.(file.id);
    prefetchFile();
    onContextMenu(file, event.clientX, event.clientY);
  }

  function handleClick(event: React.MouseEvent) {
    if (!canOpen) return;

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      showContextMenu(event);
      clickTimeoutRef.current = null;
    }, 200);
  }

  function handleDoubleClick(event: React.MouseEvent) {
    if (!canOpen) return;

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    event.preventDefault();
    openFile();
  }

  return (
    <article
      role="button"
      tabIndex={canOpen ? 0 : -1}
      aria-pressed={selected}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={prefetchFile}
      onFocus={prefetchFile}
      onContextMenu={showContextMenu}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          openFile(true);
        }
      }}
      onKeyDown={(event) => {
        if (!canOpen) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(file.id);
        }
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          onSelect?.(file.id);
          prefetchFile();
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          onContextMenu(file, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }}
      className={cn(
        "group flex h-full cursor-default select-none flex-col overflow-hidden rounded-md border bg-hub-surface text-left shadow-sm transition-[box-shadow,border-color] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-primary/50",
        selected
          ? "border-hub-accent ring-2 ring-hub-accent/35"
          : "border-hub-foreground/10",
        !canOpen && "opacity-70",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-hub-foreground/5">
        <ProjectFileThumbnail type={file.type} fileId={file.id} />

        {onFavoriteToggle && (
          <button
            type="button"
            aria-label={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={file.isFavorite}
            onClick={handleFavoriteToggle}
            onDoubleClick={(event) => event.stopPropagation()}
            className={cn(
              "absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-md border shadow-[0_2px_12px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[opacity,border-color,transform,box-shadow,background-color] duration-300 ease-out",
              file.isFavorite
                ? "border-white/45 bg-hub-surface/25 opacity-100 scale-100"
                : "border-white/35 bg-hub-surface/20 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 hover:border-white/50 hover:bg-hub-surface/30 active:scale-90",
            )}
          >
            <Star
              className={cn(
                "size-4 stroke-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-[fill,transform] duration-300 ease-out",
                file.isFavorite ? "fill-hub-favorite scale-100" : "fill-white/75 scale-90",
              )}
            />
          </button>
        )}
      </div>

      <div className="space-y-1 border-t border-hub-foreground/8 bg-hub-foreground/[0.03] p-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-hub-primary/10 text-hub-primary">
            <Icon className="size-3.5" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-sm font-extrabold tracking-tight text-hub-foreground">
              {file.name}
            </h3>
            <p className="mt-0.5 text-xs text-hub-foreground/55">
              {formatEditedTime(editedAt)}
            </p>
            <p className="text-xs text-hub-foreground/45">
              {file.type === "canvas"
                ? "Open canvas"
                : file.type === "text_document"
                  ? "Text document"
                  : `${file.asset_count} asset${file.asset_count === 1 ? "" : "s"}`}
            </p>
          </div>

          <MemberAvatar
            displayName={editorDisplayName}
            avatarUrl={editorAvatarUrl}
            variant="primary"
            size="xs"
            className="mt-0.5 shrink-0"
          />
        </div>
      </div>
    </article>
  );
}
