"use client";

import { CheckSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { ProjectTasksThumbnail } from "@/components/project-files/project-file-thumbnail";
import { MemberAvatar } from "@/components/projects/member-avatar";
import { projectTasksPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ProjectRouter = Pick<ReturnType<typeof useRouter>, "push" | "prefetch">;

export function navigateToProjectTasks(
  router: ProjectRouter,
  projectId: string,
  options?: { newTab?: boolean },
) {
  const href = projectTasksPath(projectId);

  if (options?.newTab) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  router.prefetch(href);
  router.push(href);
}

type ProjectTasksCardProps = {
  projectId: string;
  projectName?: string;
  taskCount?: number;
  selected?: boolean;
  editorDisplayName?: string;
  editorAvatarUrl?: string | null;
  onSelect?: () => void;
  onContextMenu: (x: number, y: number) => void;
};

export function ProjectTasksCard({
  projectId,
  taskCount = 0,
  selected = false,
  editorDisplayName = "Unknown user",
  editorAvatarUrl,
  onSelect,
  onContextMenu,
}: ProjectTasksCardProps) {
  const router = useRouter();
  const clickTimeoutRef = useRef<number | null>(null);
  const href = projectTasksPath(projectId);

  const prefetchTasks = useCallback(() => {
    router.prefetch(href);
  }, [href, router]);

  function openTasks(newTab = false) {
    navigateToProjectTasks(router, projectId, { newTab });
  }

  function showContextMenu(event: React.MouseEvent) {
    event.preventDefault();
    onSelect?.();
    prefetchTasks();
    onContextMenu(event.clientX, event.clientY);
  }

  function handleClick(event: React.MouseEvent) {
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      showContextMenu(event);
      clickTimeoutRef.current = null;
    }, 200);
  }

  function handleDoubleClick(event: React.MouseEvent) {
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    event.preventDefault();
    openTasks();
  }

  const taskMeta =
    taskCount > 0
      ? `${taskCount} open task${taskCount === 1 ? "" : "s"}`
      : "Project task list";

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={prefetchTasks}
      onFocus={prefetchTasks}
      onContextMenu={showContextMenu}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          openTasks(true);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          onSelect?.();
          prefetchTasks();
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          onContextMenu(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }}
      className={cn(
        "group flex h-full cursor-default select-none flex-col overflow-hidden rounded-md border bg-hub-surface text-left shadow-sm transition-[box-shadow,border-color] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-primary/50",
        selected
          ? "border-hub-primary ring-2 ring-hub-primary/35"
          : "border-hub-foreground/10",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-hub-foreground/5">
        <ProjectTasksThumbnail projectId={projectId} />
      </div>

      <div className="space-y-1 border-t border-hub-foreground/8 bg-hub-foreground/[0.03] p-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-hub-primary/10 text-hub-primary">
            <CheckSquare className="size-3.5" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-sm font-extrabold tracking-tight text-hub-foreground">
              Tasks
            </h3>
            <p className="mt-0.5 text-xs text-hub-foreground/55">Always available</p>
            <p className="text-xs text-hub-foreground/45">{taskMeta}</p>
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
