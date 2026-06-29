"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { projectTasksPath } from "@/lib/routes";
import { getTasksForAsset } from "@/lib/tasks/task-assets";
import type { TaskOnAssetSummary } from "@/lib/tasks/task-assets";
import { cn } from "@/lib/utils";

type AssetLinkedTasksProps = {
  assetId: string;
  projectId: string;
  className?: string;
};

function AssetTasksEmptyState() {
  return (
    <div className="flex items-start gap-2 rounded-[6px] border border-dashed border-hub-foreground/12 bg-hub-foreground/[0.02] px-3 py-2.5">
      <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-hub-foreground/35" />
      <p className="text-xs leading-relaxed text-hub-foreground/50">
        No open tasks linked to this file yet. Use{" "}
        <span className="font-medium text-hub-foreground/65">Create task from comment</span>{" "}
        on feedback, or press <kbd className="rounded border border-hub-foreground/15 px-1">Q</kbd>{" "}
        to quick-add one.
      </p>
    </div>
  );
}

export function AssetLinkedTasks({ assetId, projectId, className }: AssetLinkedTasksProps) {
  const [tasks, setTasks] = useState<TaskOnAssetSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const data = await getTasksForAsset(supabase, assetId);
      setTasks(data.filter((t) => !t.completed));
      setLoaded(true);
    }
    void load();
  }, [assetId]);

  return (
    <div className={cn("border-t border-hub-foreground/10 px-4 py-3", className)}>
      <h3 className="text-[0.6875rem] font-medium uppercase tracking-wide text-hub-foreground/45">
        Open tasks
      </h3>
      {loaded && tasks.length === 0 ? (
        <div className="mt-2">
          <AssetTasksEmptyState />
        </div>
      ) : (
        <ul className="mt-2 space-y-1">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`${projectTasksPath(projectId)}?task=${task.id}`}
                className="block rounded-[4px] px-2 py-1.5 text-sm text-hub-foreground/80 transition-colors hover:bg-hub-foreground/[0.04]"
              >
                {task.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
