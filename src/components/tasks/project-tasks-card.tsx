"use client";

import Link from "next/link";
import { CheckSquare } from "lucide-react";

import { projectTasksPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ProjectTasksCardProps = {
  projectId: string;
  taskCount?: number;
};

export function ProjectTasksCard({ projectId, taskCount = 0 }: ProjectTasksCardProps) {
  return (
    <Link
      href={projectTasksPath(projectId)}
      className={cn(
        "group flex h-full min-h-[10.5rem] flex-col overflow-hidden rounded-[8px] border border-hub-foreground/10 bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="flex size-9 items-center justify-center rounded-[6px] bg-emerald-600/12 text-emerald-700">
          <CheckSquare className="size-4" aria-hidden />
        </div>
        <div>
          <p className="font-display text-[0.9375rem] font-extrabold leading-tight text-hub-thumb-ink/88">
            Tasks
          </p>
          <p className="mt-0.5 text-[0.6875rem] text-emerald-800/75">
            {taskCount > 0 ? `${taskCount} open` : "Project task list"}
          </p>
        </div>
      </div>
    </Link>
  );
}
