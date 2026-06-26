"use client";

import { ClipboardList, PenTool, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { formatEditedTime } from "@/lib/format-edited-time";
import { MemberAvatar } from "@/components/projects/member-avatar";
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import { fileTypeLabel } from "@/lib/project-files/queries";
import { reviewBoardPath } from "@/lib/routes";
import { captureReviewBoardNavigationSnapshot } from "@/lib/projects/review-board-snapshot";
import { cn } from "@/lib/utils";

type ProjectRouter = Pick<ReturnType<typeof useRouter>, "push" | "prefetch">;

export function navigateToProjectFile(
  router: ProjectRouter,
  projectId: string,
  file: ProjectFileWithMeta,
  options?: { newTab?: boolean; projectName?: string },
) {
  if (file.type !== "review_board") return;

  const href = reviewBoardPath(projectId, file.id);

  captureReviewBoardNavigationSnapshot({
    projectId,
    boardId: file.id,
    projectName: options?.projectName ?? "Project",
    boardName: file.name,
    sectionCount: file.section_count,
    assetCount: file.asset_count,
  });

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
  isFavorite?: boolean;
  onSelect?: (fileId: string) => void;
  onContextMenu: (file: ProjectFileWithMeta, x: number, y: number) => void;
};

export function ProjectFileCard({
  file,
  projectId,
  projectName,
  selected = false,
  editorDisplayName = "Unknown user",
  editorAvatarUrl,
  isFavorite = true,
  onSelect,
  onContextMenu,
}: ProjectFileCardProps) {
  const router = useRouter();
  const clickTimeoutRef = useRef<number | null>(null);
  const canOpen = file.type === "review_board";
  const href = canOpen ? reviewBoardPath(projectId, file.id) : null;

  const Icon = file.type === "review_board" ? ClipboardList : PenTool;
  const editedAt = file.created_at;

  const prefetchFile = useCallback(() => {
    if (!href) return;
    router.prefetch(href);
  }, [href, router]);

  function openFile(newTab = false) {
    if (!canOpen) return;
    navigateToProjectFile(router, projectId, file, { newTab, projectName });
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
        "group flex h-full cursor-default select-none flex-col overflow-hidden rounded-md border bg-white text-left shadow-sm transition-[box-shadow,border-color] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-primary/50",
        selected
          ? "border-hub-accent ring-2 ring-hub-accent/35"
          : "border-hub-espresso/10",
        !canOpen && "opacity-70",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-hub-espresso/5">
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#f8fafc_0%,#f1f5f9_45%,#ffffff_100%)]">
          <div className="flex size-12 items-center justify-center rounded-md border border-hub-espresso/10 bg-white text-hub-primary shadow-sm">
            <Icon className="size-6" aria-hidden />
          </div>
          <span
            aria-hidden
            className="pointer-events-none font-mono text-[0.6rem] uppercase tracking-[0.14em] text-hub-espresso/40"
          >
            {fileTypeLabel(file.type)}
          </span>
        </div>

        {isFavorite && (
          <span
            className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-md border border-white/40 bg-white/25 shadow-[0_2px_12px_rgba(0,0,0,0.12)] backdrop-blur-md"
            aria-label="Favorite"
          >
            <Star className="size-4 fill-hub-favorite stroke-none" aria-hidden />
          </span>
        )}
      </div>

      <div className="space-y-1 border-t border-hub-espresso/8 bg-hub-espresso/[0.03] p-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-hub-primary/10 text-hub-primary">
            <Icon className="size-3.5" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-sm font-extrabold tracking-tight text-hub-espresso">
              {file.name}
            </h3>
            <p className="mt-0.5 text-xs text-hub-espresso/55">
              {formatEditedTime(editedAt)}
            </p>
            <p className="text-xs text-hub-espresso/45">
              {file.asset_count} asset{file.asset_count === 1 ? "" : "s"}
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
