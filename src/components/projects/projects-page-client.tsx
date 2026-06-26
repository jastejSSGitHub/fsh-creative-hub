"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState, useTransition } from "react";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import {
  copyProjectLink,
  navigateToProject,
  ProjectCard,
} from "@/components/projects/project-card";
import {
  ProjectContextMenu,
  type ProjectContextMenuItem,
} from "@/components/projects/project-context-menu";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { InviteMembersDialog } from "@/components/projects/invite-members-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  duplicateProjectAction,
  restoreProjectAction,
  toggleProjectFavoriteAction,
  trashProjectAction,
} from "@/lib/projects/actions";
import { captureProjectsPageSnapshot } from "@/lib/projects/snapshot";
import { fireConfetti } from "@/lib/confetti";
import type { ProjectCardData } from "@/lib/projects/queries";
import { hubCardGridClassName } from "@/lib/ui/hub-card-grid";
import { canAdmin } from "@/lib/permissions";

import { cn } from "@/lib/utils";

type ProjectsPageClientProps = {
  projects: ProjectCardData[];
  currentUserId: string;
};

type ProjectsView = "all" | "trash";

type ContextMenuState = {
  project: ProjectCardData;
  x: number;
  y: number;
} | null;

export function ProjectsPageClient({
  projects,
  currentUserId,
}: ProjectsPageClientProps) {
  const router = useRouter();
  const [localProjects, setLocalProjects] = useState(projects);
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<ProjectsView>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [renameTarget, setRenameTarget] = useState<ProjectCardData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCardData | null>(null);
  const [shareTarget, setShareTarget] = useState<ProjectCardData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useLayoutEffect(() => {
    captureProjectsPageSnapshot(projects);
  }, [projects]);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const activeProjects = useMemo(
    () => localProjects.filter((project) => !project.trashed_at),
    [localProjects],
  );
  const trashedProjects = useMemo(
    () => localProjects.filter((project) => project.trashed_at),
    [localProjects],
  );

  const sortedActiveProjects = useMemo(() => {
    const favorites = activeProjects
      .filter((project) => project.isFavorite)
      .sort(
        (a, b) =>
          new Date(b.favoritedAt ?? b.updated_at).getTime() -
          new Date(a.favoritedAt ?? a.updated_at).getTime(),
      );
    const regular = activeProjects.filter((project) => !project.isFavorite);

    return [...favorites, ...regular];
  }, [activeProjects]);

  const visibleProjects = view === "trash" ? trashedProjects : activeProjects;

  function showToast(message: string, options?: { confetti?: boolean }) {
    setToast(message);
    if (options?.confetti) {
      fireConfetti();
    }
    window.setTimeout(() => setToast(null), 2200);
  }

  function restoreProject(project: ProjectCardData) {
    const previous = localProjects;

    setLocalProjects((current) =>
      current.map((entry) =>
        entry.id === project.id
          ? { ...entry, trashed_at: null, updated_at: new Date().toISOString() }
          : entry,
      ),
    );
    setView("all");
    setSelectedProjectId(project.id);

    startTransition(async () => {
      const result = await restoreProjectAction(project.id);
      if (!result.ok) {
        setLocalProjects(previous);
        showToast(result.error ?? "Could not restore project.");
        return;
      }
      showToast("Project restored", { confetti: true });
      router.refresh();
    });
  }

  function removeProjectFromList(projectId: string) {
    setLocalProjects((current) => current.filter((project) => project.id !== projectId));
    setSelectedProjectId((current) => (current === projectId ? null : current));
  }

  function refreshProjects() {
    router.refresh();
  }

  function toggleFavorite(projectId: string, favorite: boolean) {
    const previous = localProjects;

    setLocalProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              isFavorite: favorite,
              favoritedAt: favorite ? new Date().toISOString() : null,
            }
          : project,
      ),
    );

    void toggleProjectFavoriteAction(projectId, favorite).then((result) => {
      if (!result.ok) {
        setLocalProjects(previous);
        showToast(result.error ?? "Could not update favorite.");
        return;
      }
      router.refresh();
    });
  }

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>, successMessage?: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        showToast(result.error ?? "Something went wrong.");
        return;
      }
      refreshProjects();
      if (successMessage) showToast(successMessage);
    });
  }

  function buildContextMenuItems(project: ProjectCardData): ProjectContextMenuItem[] {
    const isTrashed = Boolean(project.trashed_at);
    const isAdmin = canAdmin(project.role);

    if (isTrashed) {
      return [
        {
          id: "restore",
          label: "Restore project",
          onSelect: () => restoreProject(project),
          disabled: !isAdmin || isPending,
        },
        {
          id: "delete-permanently",
          label: "Delete permanently",
          onSelect: () => setDeleteTarget(project),
          disabled: !isAdmin || isPending,
          destructive: true,
          separatorBefore: true,
        },
      ];
    }

    return [
      {
        id: "open",
        label: "Open",
        onSelect: () => {
          rememberSnapshotBeforeNavigate();
          navigateToProject(router, project.id);
        },
      },
      {
        id: "open-new-tab",
        label: "Open in new tab",
        onSelect: () => {
          rememberSnapshotBeforeNavigate();
          navigateToProject(router, project.id, { newTab: true });
        },
      },
      {
        id: "favorite",
        label: project.isFavorite ? "Remove from favorites" : "Add to favorites",
        onSelect: () => toggleFavorite(project.id, !project.isFavorite),
        separatorBefore: true,
      },
      {
        id: "copy-link",
        label: "Copy link",
        onSelect: () => {
          void copyProjectLink(project.id).then(() => showToast("Link copied"));
        },
      },
      {
        id: "share",
        label: "Share",
        onSelect: () => setShareTarget(project),
      },
      {
        id: "duplicate",
        label: "Duplicate",
        onSelect: () =>
          runAction(() => duplicateProjectAction(project.id), "Project duplicated"),
        disabled: !isAdmin || isPending,
        separatorBefore: true,
      },
      {
        id: "rename",
        label: "Rename",
        onSelect: () => setRenameTarget(project),
        disabled: !isAdmin,
      },
      {
        id: "trash",
        label: "Move to trash",
        onSelect: () =>
          runAction(() => trashProjectAction(project.id), "Moved to trash"),
        disabled: !isAdmin || isPending,
        destructive: true,
        separatorBefore: true,
      },
    ];
  }

  function rememberSnapshotBeforeNavigate() {
    captureProjectsPageSnapshot(localProjects);
  }

  function renderGrid(projectList: ProjectCardData[], emptyMessage: string) {
    if (projectList.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-hub-espresso/15 bg-white/60 px-6 py-12 text-center">
          <p className="text-sm text-hub-espresso/55">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className={hubCardGridClassName}>
        {projectList.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            selected={selectedProjectId === project.id}
            onSelect={setSelectedProjectId}
            onBeforeOpen={rememberSnapshotBeforeNavigate}
            onFavoriteToggle={toggleFavorite}
            onContextMenu={(target, x, y) =>
              setContextMenu({ project: target, x, y })
            }
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <section
        className="min-w-0 space-y-5 sm:space-y-6"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setSelectedProjectId(null);
          }
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-hub-espresso sm:text-3xl lg:text-4xl">
              Projects
            </h1>
            <p className="text-sm text-hub-espresso/55">
              {view === "trash"
                ? `${trashedProjects.length} archived project${trashedProjects.length === 1 ? "" : "s"}`
                : `${activeProjects.length} active project${activeProjects.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex min-h-9 w-full shrink-0 items-center justify-center gap-1.5 self-end rounded-[6px] bg-hub-primary px-3 text-[0.8125rem] font-medium text-white shadow-sm transition-colors hover:bg-[#1590e8] sm:w-auto"
          >
            <Plus className="size-4" aria-hidden />
            Create project
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setView("all");
              setSelectedProjectId(null);
            }}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "all"
                ? "bg-white text-hub-espresso shadow-sm"
                : "text-hub-espresso/50 hover:text-hub-espresso",
            )}
          >
            All projects
          </button>
          <button
            type="button"
            onClick={() => {
              setView("trash");
              setSelectedProjectId(null);
            }}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "trash"
                ? "bg-white text-hub-espresso shadow-sm"
                : "text-hub-espresso/50 hover:text-hub-espresso",
            )}
          >
            Trash
            {trashedProjects.length > 0 && (
              <span className="ml-1.5 font-mono text-[0.65rem] text-hub-espresso/45">
                {trashedProjects.length}
              </span>
            )}
          </button>
        </div>

        {view === "all" && activeProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hub-espresso/15 bg-white/60 px-6 py-12 text-center sm:py-16">
            <p className="font-display text-2xl font-extrabold text-hub-espresso">
              Drop your first project here
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-hub-espresso/55">
              Projects group initiatives and creative assets for one client or
              campaign. Use Create project to get started.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-6 min-h-11 rounded-xl bg-hub-final text-hub-espresso hover:bg-hub-final/90",
              )}
            >
              Create your first project
            </button>
          </div>
        ) : view === "all" ? (
          renderGrid(sortedActiveProjects, "No projects yet.")
        ) : (
          renderGrid(visibleProjects, "Trash is empty.")
        )}
      </section>

      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <RenameProjectDialog
        open={Boolean(renameTarget)}
        projectId={renameTarget?.id ?? null}
        currentName={renameTarget?.name ?? ""}
        onClose={() => setRenameTarget(null)}
        onRenamed={refreshProjects}
      />

      <InviteMembersDialog
        project={shareTarget}
        currentUserId={currentUserId}
        onClose={() => setShareTarget(null)}
      />

      <DeleteProjectDialog
        open={Boolean(deleteTarget)}
        projectId={deleteTarget?.id ?? null}
        projectName={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          if (deleteTarget) {
            removeProjectFromList(deleteTarget.id);
          }
          showToast("Project permanently deleted");
          router.refresh();
        }}
      />

      <ProjectContextMenu
        open={Boolean(contextMenu)}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenu ? buildContextMenuItems(contextMenu.project) : []}
        onClose={() => setContextMenu(null)}
      />

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 rounded-full border border-hub-espresso/10 bg-hub-espresso px-4 py-2 text-sm font-medium text-white shadow-lg duration-300">
          {toast}
        </div>
      )}
    </>
  );
}
