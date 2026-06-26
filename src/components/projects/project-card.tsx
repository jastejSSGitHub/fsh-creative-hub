"use client";

import { FolderKanban, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { formatEditedTime } from "@/lib/format-edited-time";
import type { ProjectCardData } from "@/lib/projects/queries";
import { captureProjectNavigationSnapshot } from "@/lib/projects/project-navigation-snapshot";
import { projectPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

function projectCoverTitleClass(name: string): string {
  if (name.length <= 10) return "text-[1.75rem] sm:text-[2rem]";
  if (name.length <= 18) return "text-2xl sm:text-[1.75rem]";
  if (name.length <= 28) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}

type ProjectRouter = Pick<ReturnType<typeof useRouter>, "push" | "prefetch">;

export function navigateToProject(
  router: ProjectRouter,
  projectId: string,
  options?: { newTab?: boolean; projectName?: string; fileCount?: number },
) {
  const href = projectPath(projectId);

  if (options?.projectName) {
    captureProjectNavigationSnapshot({
      projectId,
      projectName: options.projectName,
      fileCount: options.fileCount,
    });
  }

  if (options?.newTab) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  router.prefetch(href);
  router.push(href);
}

type ProjectCardProps = {
  project: ProjectCardData;
  selected: boolean;
  onSelect: (projectId: string) => void;
  onBeforeOpen?: () => void;
  onContextMenu: (project: ProjectCardData, x: number, y: number) => void;
  onFavoriteToggle?: (projectId: string, favorite: boolean) => void;
  showFavoriteStar?: boolean;
};

export function ProjectCard({
  project,
  selected,
  onSelect,
  onBeforeOpen,
  onContextMenu,
  onFavoriteToggle,
  showFavoriteStar = true,
}: ProjectCardProps) {
  const router = useRouter();
  const [coverError, setCoverError] = useState(false);
  const editedAt = project.lastActivityAt ?? project.updated_at ?? project.created_at;
  const href = projectPath(project.id);

  const prefetchProject = useCallback(() => {
    router.prefetch(href);
  }, [href, router]);

  function openProject(newTab = false) {
    onBeforeOpen?.();
    navigateToProject(router, project.id, {
      newTab,
      projectName: project.name,
      fileCount: project.assetCount,
    });
  }

  function handleFavoriteToggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onFavoriteToggle?.(project.id, !project.isFavorite);
  }

  function handleDoubleClick(event: React.MouseEvent) {
    event.preventDefault();
    openProject();
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => {
        onSelect(project.id);
        prefetchProject();
      }}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={prefetchProject}
      onFocus={prefetchProject}
      onContextMenu={(event) => {
        event.preventDefault();
        onSelect(project.id);
        prefetchProject();
        onContextMenu(project, event.clientX, event.clientY);
      }}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          openProject(true);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(project.id);
        }
      }}
      className={cn(
        "group relative flex h-full cursor-default select-none flex-col overflow-hidden rounded-md border bg-hub-surface shadow-sm transition-[box-shadow,border-color] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-primary/50",
        selected
          ? "border-hub-accent ring-2 ring-hub-accent/35"
          : "border-hub-foreground/10",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-hub-foreground/5">
        {project.cover_url && !coverError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover_url}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => setCoverError(true)}
            draggable={false}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[linear-gradient(135deg,#0b0b0b_0%,#2a2418_55%,#fbf7ee_100%)] px-4 py-3">
            <p
              aria-hidden
              className={cn(
                "pointer-events-none line-clamp-2 text-balance text-center font-display font-extrabold leading-[1.05] tracking-tight text-white/90",
                projectCoverTitleClass(project.name),
              )}
            >
              {project.name}
            </p>
          </div>
        )}

        {showFavoriteStar && onFavoriteToggle && (
          <button
            type="button"
            aria-label={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={project.isFavorite}
            onClick={handleFavoriteToggle}
            onDoubleClick={(event) => event.stopPropagation()}
            className={cn(
              "absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-md border shadow-[0_2px_12px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[opacity,border-color,transform,box-shadow] duration-150",
              project.isFavorite
                ? "border-white/45 bg-white/25 opacity-100"
                : "border-white/35 bg-white/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:border-white/50 hover:bg-white/30 active:scale-95",
            )}
          >
            <Star
              className={cn(
                "size-4 stroke-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-[fill,opacity] duration-150",
                project.isFavorite
                  ? "fill-hub-favorite"
                  : "fill-white/75",
              )}
            />
          </button>
        )}
      </div>

      <div className="space-y-1 border-t border-hub-foreground/8 bg-hub-foreground/[0.03] p-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-hub-accent/15 text-hub-accent">
            <FolderKanban className="size-3.5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-sm font-extrabold tracking-tight text-hub-foreground">
              {project.name}
            </h2>
            <p className="mt-0.5 text-xs text-hub-foreground/55">
              {formatEditedTime(editedAt)}
            </p>
            <p className="text-xs text-hub-foreground/45">
              {project.assetCount} asset{project.assetCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function copyProjectLink(projectId: string) {
  const url = `${window.location.origin}${projectPath(projectId)}`;
  return navigator.clipboard.writeText(url);
}
