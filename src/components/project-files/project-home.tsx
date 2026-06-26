"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ProjectCreateMenu } from "@/components/project-files/project-create-menu";
import {
  navigateToProjectFile,
  ProjectFileCard,
} from "@/components/project-files/project-file-card";
import {
  ProjectContextMenu,
  type ProjectContextMenuItem,
} from "@/components/projects/project-context-menu";
import {
  ProjectFileSortMenu,
  type FileSortField,
  type FileSortOrder,
} from "@/components/project-files/project-file-sort-menu";
import { ProjectTemplatesBanner } from "@/components/project-files/project-templates-banner";
import { ProjectInlineTitle } from "@/components/projects/project-inline-title";
import { NavBackLink } from "@/components/ui/nav-back-link";
import { HubSelect } from "@/components/ui/hub-select";
import { toggleProjectFileFavoriteAction } from "@/lib/project-files/actions";
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import { canAdmin, canEdit } from "@/lib/permissions";
import type { ProjectCardData } from "@/lib/projects/queries";
import { hubCardGridClassName } from "@/lib/ui/hub-card-grid";
import type { HubProject, HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

type FileTypeFilter = "all" | "review_board" | "canvas" | "text_document";

const FILE_TYPE_OPTIONS: { value: FileTypeFilter; label: string }[] = [
  { value: "all", label: "All files" },
  { value: "review_board", label: "Review boards" },
  { value: "canvas", label: "Canvases" },
  { value: "text_document", label: "Text documents" },
];

const FILE_LAYOUT_TRANSITION = {
  layout: {
    duration: 0.48,
    ease: [0.4, 0, 0.2, 1] as const,
  },
};

const SECTION_TRANSITION = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1] as const,
};

type FileContextMenuState = {
  file: ProjectFileWithMeta;
  x: number;
  y: number;
} | null;

type ProjectHomeProps = {
  project: HubProject;
  role: HubRole;
  files: ProjectFileWithMeta[];
  projectCard: ProjectCardData;
  currentUserId: string;
  onCreateReviewBoard: () => void;
  onCreateCanvas: () => void;
  onCreateTextDocument: () => void;
  onShare: () => void;
};

function sortFiles(
  files: ProjectFileWithMeta[],
  sortField: FileSortField,
  sortOrder: FileSortOrder,
): ProjectFileWithMeta[] {
  const sorted = [...files].sort((a, b) => {
    if (sortField === "alphabetical") {
      return a.name.localeCompare(b.name);
    }

    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return aTime - bTime;
  });

  if (sortOrder === "newest") {
    sorted.reverse();
  }

  return sorted;
}

function sortFavoriteFiles(files: ProjectFileWithMeta[]): ProjectFileWithMeta[] {
  return [...files].sort(
    (a, b) =>
      new Date(b.favoritedAt ?? b.created_at).getTime() -
      new Date(a.favoritedAt ?? a.created_at).getTime(),
  );
}

type AnimatedFileCardProps = {
  file: ProjectFileWithMeta;
  projectId: string;
  projectName: string;
  selected: boolean;
  editorDisplayName: string;
  editorAvatarUrl?: string | null;
  animateLayout: boolean;
  onSelect: (fileId: string) => void;
  onFavoriteToggle: (fileId: string, favorite: boolean) => void;
  onContextMenu: (file: ProjectFileWithMeta, x: number, y: number) => void;
};

function AnimatedFileCard({
  file,
  animateLayout,
  ...cardProps
}: AnimatedFileCardProps) {
  return (
    <motion.div
      layout={animateLayout}
      layoutId={animateLayout ? file.id : undefined}
      transition={FILE_LAYOUT_TRANSITION}
      className="h-full"
    >
      <ProjectFileCard file={file} {...cardProps} />
    </motion.div>
  );
}

export function ProjectHome({
  project,
  role,
  files,
  projectCard,
  currentUserId,
  onCreateReviewBoard,
  onCreateCanvas,
  onCreateTextDocument,
  onShare,
}: ProjectHomeProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const animateLayout = !reduceMotion;
  const canCreate = canEdit(role);
  const [localFiles, setLocalFiles] = useState(files);
  const [sortField, setSortField] = useState<FileSortField>("last_modified");
  const [sortOrder, setSortOrder] = useState<FileSortOrder>("newest");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<FileContextMenuState>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  const currentMember = projectCard.members.find(
    (member) => member.id === currentUserId,
  );

  const filteredFiles = useMemo(() => {
    const byType =
      typeFilter === "all"
        ? localFiles
        : localFiles.filter((file) => file.type === typeFilter);

    return sortFiles(byType, sortField, sortOrder);
  }, [localFiles, sortField, sortOrder, typeFilter]);

  const favoriteFiles = useMemo(
    () => sortFavoriteFiles(filteredFiles.filter((file) => file.isFavorite)),
    [filteredFiles],
  );

  const regularFiles = useMemo(
    () => filteredFiles.filter((file) => !file.isFavorite),
    [filteredFiles],
  );

  const hasFavorites = favoriteFiles.length > 0;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function toggleFavorite(fileId: string, favorite: boolean) {
    const previous = localFiles;

    setLocalFiles((current) =>
      current.map((file) =>
        file.id === fileId
          ? {
              ...file,
              isFavorite: favorite,
              favoritedAt: favorite ? new Date().toISOString() : null,
            }
          : file,
      ),
    );

    void toggleProjectFileFavoriteAction(project.id, fileId, favorite).then((result) => {
      if (!result.ok) {
        setLocalFiles(previous);
        showToast(result.error ?? "Could not update favorite.");
        return;
      }
      router.refresh();
    });
  }

  function buildFileContextMenuItems(file: ProjectFileWithMeta): ProjectContextMenuItem[] {
    return [
      {
        id: "open",
        label: "Open",
        onSelect: () =>
          navigateToProjectFile(router, project.id, file, {
            projectName: project.name,
          }),
        disabled: false,
      },
      {
        id: "open-new-tab",
        label: "Open in new tab",
        onSelect: () =>
          navigateToProjectFile(router, project.id, file, {
            newTab: true,
            projectName: project.name,
          }),
        disabled: false,
      },
      {
        id: "favorite",
        label: file.isFavorite ? "Remove from favorites" : "Add to favorites",
        onSelect: () => toggleFavorite(file.id, !file.isFavorite),
        separatorBefore: true,
      },
    ];
  }

  function renderAnimatedFileCard(file: ProjectFileWithMeta) {
    return (
      <AnimatedFileCard
        key={file.id}
        file={file}
        projectId={project.id}
        projectName={project.name}
        selected={selectedFileId === file.id}
        editorDisplayName={currentMember?.display_name ?? "Unknown user"}
        editorAvatarUrl={currentMember?.avatar_url}
        animateLayout={animateLayout}
        onSelect={setSelectedFileId}
        onFavoriteToggle={toggleFavorite}
        onContextMenu={(target, x, y) =>
          setContextMenu({ file: target, x, y })
        }
      />
    );
  }

  function renderFileSections() {
    const sectionMotion = animateLayout
      ? SECTION_TRANSITION
      : { duration: 0 };

    return (
      <LayoutGroup id={`project-files-${project.id}`}>
        <motion.div
          layout={animateLayout}
          transition={FILE_LAYOUT_TRANSITION}
          className={cn(hasFavorites ? "space-y-6" : "space-y-0")}
        >
          <motion.div layout={animateLayout} transition={FILE_LAYOUT_TRANSITION}>
            <motion.h2
              className="min-h-7 font-display text-sm font-bold tracking-tight text-hub-foreground/55"
              initial={false}
              animate={{ opacity: hasFavorites ? 1 : 0 }}
              transition={sectionMotion}
              aria-hidden={!hasFavorites}
            >
              <span className={hasFavorites ? "" : "invisible select-none"}>
                Favorites
              </span>
            </motion.h2>

            <motion.div
              layout={animateLayout}
              transition={FILE_LAYOUT_TRANSITION}
              className={cn(hubCardGridClassName, hasFavorites && "mt-3")}
            >
              {favoriteFiles.map(renderAnimatedFileCard)}
            </motion.div>
          </motion.div>

          <motion.div
            layout={animateLayout}
            transition={FILE_LAYOUT_TRANSITION}
            className={cn(!hasFavorites && "-mt-7")}
          >
            <motion.h2
              className="min-h-7 font-display text-sm font-bold tracking-tight text-hub-foreground/55"
              initial={false}
              animate={{ opacity: hasFavorites ? 1 : 0 }}
              transition={sectionMotion}
              aria-hidden={!hasFavorites}
            >
              <span className={hasFavorites ? "" : "invisible select-none"}>
                All other files
              </span>
            </motion.h2>

            <motion.div
              layout={animateLayout}
              transition={FILE_LAYOUT_TRANSITION}
              className={cn(hubCardGridClassName, hasFavorites && "mt-3")}
            >
              {regularFiles.map(renderAnimatedFileCard)}
            </motion.div>
          </motion.div>
        </motion.div>
      </LayoutGroup>
    );
  }

  return (
    <>
    <section
      className="min-w-0 space-y-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setSelectedFileId(null);
        }
      }}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <NavBackLink href="/projects" label="All Projects" className="justify-self-start" />

        <div className="flex justify-center justify-self-center px-2">
          <ProjectInlineTitle
            projectId={project.id}
            name={project.name}
            canRename={canAdmin(role)}
            variant="header"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end justify-self-end gap-2">
          <ProjectCreateMenu
            canCreate={canCreate}
            onCreateReviewBoard={onCreateReviewBoard}
            onCreateCanvas={onCreateCanvas}
            onCreateTextDocument={onCreateTextDocument}
          />

          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-9 items-center rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-3.5 text-[0.8125rem] font-medium text-hub-foreground transition-colors hover:bg-hub-foreground/[0.03]"
          >
            Share
          </button>

          {projectCard.isFavorite && (
            <span
              className="inline-flex size-9 items-center justify-center rounded-[6px] border border-hub-foreground/10 bg-hub-surface"
              aria-label="Favorited project"
            >
              <Star className="size-4 fill-hub-favorite stroke-none" aria-hidden />
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <HubSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={FILE_TYPE_OPTIONS}
          aria-label="Filter files"
          variant="field"
          menuAlign="right"
        />

        <ProjectFileSortMenu
          sortField={sortField}
          sortOrder={sortOrder}
          onSortFieldChange={setSortField}
          onSortOrderChange={setSortOrder}
          menuAlign="right"
        />
      </div>

      <ProjectTemplatesBanner
        projectId={project.id}
        onUseTemplate={() => onCreateReviewBoard()}
      />

      {filteredFiles.length === 0 ? (
        <div className="rounded-md border border-dashed border-hub-foreground/15 bg-hub-surface/70 px-6 py-14 text-center">
          <p className="font-display text-lg font-extrabold text-hub-foreground">
            No files yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-hub-foreground/55">
            Create a review board to upload assets, or pick a template above to get
            started quickly.
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={onCreateReviewBoard}
              className="mt-5 inline-flex min-h-9 items-center rounded-[6px] bg-hub-primary px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-[#1590e8]"
            >
              Create review board
            </button>
          )}
        </div>
      ) : (
        renderFileSections()
      )}
    </section>

    <ProjectContextMenu
      open={contextMenu !== null}
      x={contextMenu?.x ?? 0}
      y={contextMenu?.y ?? 0}
      items={contextMenu ? buildFileContextMenuItems(contextMenu.file) : []}
      onClose={() => setContextMenu(null)}
    />

    {toast && (
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 rounded-full border border-hub-foreground/10 bg-hub-espresso px-4 py-2 text-sm font-medium text-white shadow-lg duration-300">
        {toast}
      </div>
    )}
    </>
  );
}
