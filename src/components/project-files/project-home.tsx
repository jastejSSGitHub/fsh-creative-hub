"use client";

import { ClipboardList, LayoutGrid, PenTool } from "lucide-react";
import Link from "next/link";

import { ProjectInlineTitle } from "@/components/projects/project-inline-title";
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import { fileTypeLabel } from "@/lib/project-files/queries";
import { canAdmin } from "@/lib/permissions";
import { reviewBoardPath } from "@/lib/routes";
import type { HubProject, HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

type ProjectFileCardProps = {
  file: ProjectFileWithMeta;
  projectId: string;
};

export function ProjectFileCard({ file, projectId }: ProjectFileCardProps) {
  const href =
    file.type === "review_board"
      ? reviewBoardPath(projectId, file.id)
      : "#";

  const Icon = file.type === "review_board" ? ClipboardList : PenTool;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-hub-espresso/10 bg-white text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-hub-espresso/5">
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#fbf7ee_0%,#fff8e7_45%,#ffffff_100%)]">
          <div className="flex size-12 items-center justify-center rounded-xl border border-hub-espresso/10 bg-white text-hub-accent shadow-sm">
            <Icon className="size-6" aria-hidden />
          </div>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-hub-espresso/45">
            {fileTypeLabel(file.type)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-hub-espresso/8 p-3 sm:p-4">
        <h3 className="line-clamp-1 font-display text-base font-extrabold text-hub-espresso">
          {file.name}
        </h3>
        <p className="text-xs text-hub-espresso/50">
          {file.asset_count} asset{file.asset_count === 1 ? "" : "s"}
        </p>
        {file.type === "review_board" && file.approved_count > 0 && (
          <p className="text-xs font-medium text-hub-approved">
            {file.approved_count} approved
          </p>
        )}
      </div>
    </Link>
  );
}

type ProjectHomeProps = {
  project: HubProject;
  role: HubRole;
  files: ProjectFileWithMeta[];
  onCreateReviewBoard: () => void;
};

export function ProjectHome({
  project,
  role,
  files,
  onCreateReviewBoard,
}: ProjectHomeProps) {
  const canEdit = role === "admin" || role === "editor";

  return (
    <section className="min-w-0 space-y-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link
          href="/projects"
          prefetch
          className="inline-flex justify-self-start font-mono text-[0.65rem] uppercase tracking-[0.14em] text-hub-espresso/45 hover:text-hub-espresso"
        >
          ← All projects
        </Link>
        <div className="flex min-w-0 justify-center justify-self-center">
          <ProjectInlineTitle
            projectId={project.id}
            name={project.name}
            canRename={canAdmin(role)}
          />
        </div>
        <div className="flex justify-self-end">
          {canEdit ? (
            <button
              type="button"
              onClick={onCreateReviewBoard}
              className="min-h-10 shrink-0 rounded-md bg-hub-espresso px-4 text-sm font-medium text-hub-paper transition-opacity hover:opacity-90"
            >
              + New review board
            </button>
          ) : (
            <span className="min-h-10" aria-hidden />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LayoutGrid className="size-4 text-hub-espresso/40" aria-hidden />
        <h2 className="font-display text-lg font-bold text-hub-espresso">Files</h2>
      </div>

      {files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hub-espresso/15 bg-white/70 px-6 py-14 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl border border-hub-espresso/10 bg-white text-hub-accent">
            <ClipboardList className="size-7" aria-hidden />
          </div>
          <p className="mt-4 font-display text-xl font-extrabold text-hub-espresso">
            Start with a review board
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-hub-espresso/55">
            Upload marketing visuals, menus, or videos. Your team can approve, reject, and
            comment on each asset.
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={onCreateReviewBoard}
              className={cn(
                "mt-5 min-h-10 rounded-md bg-hub-espresso px-5 text-sm font-medium text-hub-paper",
              )}
            >
              Create review board
            </button>
          )}
          <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-wider text-hub-espresso/35">
            Open canvas — coming soon
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <ProjectFileCard key={file.id} file={file} projectId={project.id} />
          ))}
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-hub-espresso/12 bg-hub-espresso/[0.02] p-6 text-center">
            <PenTool className="size-6 text-hub-espresso/25" aria-hidden />
            <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-wider text-hub-espresso/35">
              Open canvas
            </p>
            <p className="mt-1 text-xs text-hub-espresso/40">Coming soon</p>
          </div>
        </div>
      )}
    </section>
  );
}
