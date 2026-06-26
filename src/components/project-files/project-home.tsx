"use client";

import { Star, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import { canAdmin, canEdit } from "@/lib/permissions";
import type { ProjectCardData } from "@/lib/projects/queries";
import { hubCardGridClassName } from "@/lib/ui/hub-card-grid";
import type { HubProject, HubRole } from "@/types/database";

type FileTypeFilter = "all" | "review_board" | "canvas";

const FILE_TYPE_OPTIONS: { value: FileTypeFilter; label: string }[] = [
  { value: "all", label: "All files" },
  { value: "review_board", label: "Review boards" },
  { value: "canvas", label: "Canvases" },
];

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

export function ProjectHome({
  project,
  role,
  files,
  projectCard,
  currentUserId,
  onCreateReviewBoard,
  onShare,
}: ProjectHomeProps) {
  const router = useRouter();
  const canCreate = canEdit(role);
  const [sortField, setSortField] = useState<FileSortField>("last_modified");
  const [sortOrder, setSortOrder] = useState<FileSortOrder>("newest");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<FileContextMenuState>(null);

  const currentMember = projectCard.members.find(
    (member) => member.id === currentUserId,
  );

  const filteredFiles = useMemo(() => {
    const byType =
      typeFilter === "all"
        ? files
        : files.filter((file) => file.type === typeFilter);

    return sortFiles(byType, sortField, sortOrder);
  }, [files, sortField, sortOrder, typeFilter]);

  const isShared = projectCard.members.length > 1;

  function buildFileContextMenuItems(file: ProjectFileWithMeta): ProjectContextMenuItem[] {
    return [
      {
        id: "open",
        label: "Open",
        onSelect: () =>
          navigateToProjectFile(router, project.id, file, {
            projectName: project.name,
          }),
        disabled: file.type !== "review_board",
      },
      {
        id: "open-new-tab",
        label: "Open in new tab",
        onSelect: () =>
          navigateToProjectFile(router, project.id, file, {
            newTab: true,
            projectName: project.name,
          }),
        disabled: file.type !== "review_board",
      },
    ];
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
          />

          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-9 items-center rounded-[6px] border border-hub-espresso/12 bg-white px-3.5 text-[0.8125rem] font-medium text-hub-espresso transition-colors hover:bg-hub-espresso/[0.03]"
          >
            Share
          </button>

          {projectCard.isFavorite && (
            <span
              className="inline-flex size-9 items-center justify-center rounded-[6px] border border-hub-espresso/10 bg-white"
              aria-label="Favorited project"
            >
              <Star className="size-4 fill-hub-favorite stroke-none" aria-hidden />
            </span>
          )}

          {isShared && (
            <span
              className="inline-flex size-9 items-center justify-center rounded-[6px] border border-hub-espresso/10 bg-white text-hub-espresso/55"
              aria-label="Shared with team"
            >
              <Users className="size-4" aria-hidden />
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
        <div className="rounded-md border border-dashed border-hub-espresso/15 bg-white/70 px-6 py-14 text-center">
          <p className="font-display text-lg font-extrabold text-hub-espresso">
            No files yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-hub-espresso/55">
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
        <div className={hubCardGridClassName}>
          {filteredFiles.map((file) => (
            <ProjectFileCard
              key={file.id}
              file={file}
              projectId={project.id}
              projectName={project.name}
              selected={selectedFileId === file.id}
              editorDisplayName={currentMember?.display_name ?? "Unknown user"}
              editorAvatarUrl={currentMember?.avatar_url}
              isFavorite
              onSelect={setSelectedFileId}
              onContextMenu={(target, x, y) =>
                setContextMenu({ file: target, x, y })
              }
            />
          ))}
        </div>
      )}
    </section>

    <ProjectContextMenu
      open={contextMenu !== null}
      x={contextMenu?.x ?? 0}
      y={contextMenu?.y ?? 0}
      items={contextMenu ? buildFileContextMenuItems(contextMenu.file) : []}
      onClose={() => setContextMenu(null)}
    />
    </>
  );
}
