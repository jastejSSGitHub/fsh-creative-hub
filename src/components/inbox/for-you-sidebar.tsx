"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  MessageSquare,
  MessageSquareReply,
  MoreHorizontal,
  PenTool,
} from "lucide-react";

import { ProjectContextMenu } from "@/components/projects/project-context-menu";
import type { SharedProjectNode } from "@/lib/inbox/sidebar-queries";
import { fileTypeShortLabel } from "@/lib/inbox/sidebar-queries";
import { FOR_YOU_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type ForYouView = "inbox" | "replies" | "assigned";

type ForYouSidebarProps = {
  sharedProjects: SharedProjectNode[];
  itemCounts: {
    inbox: number;
    replies: number;
    assigned: number;
  };
};

const INBOX_NAV: { id: ForYouView; label: string; icon: typeof MessageSquare }[] = [
  { id: "inbox", label: "Inbox", icon: MessageSquare },
  { id: "replies", label: "Replies", icon: MessageSquareReply },
  { id: "assigned", label: "Assigned comments", icon: ClipboardList },
];

export function ForYouSidebar({ sharedProjects, itemCounts }: ForYouSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeView = (searchParams.get("view") as ForYouView) || "inbox";
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    return new Set(sharedProjects.map((p) => p.id));
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    href: string;
    label: string;
  } | null>(null);

  if (!pathname.startsWith(FOR_YOU_PATH)) return null;

  function viewHref(view: ForYouView) {
    return view === "inbox" ? FOR_YOU_PATH : `${FOR_YOU_PATH}?view=${view}`;
  }

  function countForView(view: ForYouView): number {
    return itemCounts[view];
  }

  function toggleProject(projectId: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  return (
    <>
      <aside className="flex w-56 shrink-0 flex-col border-r border-hub-foreground/8 bg-hub-surface-muted">
        <nav className="flex flex-col gap-0.5 p-2 pt-3" aria-label="Inbox">
          {INBOX_NAV.map((item) => {
            const active = activeView === item.id;
            const count = countForView(item.id);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={viewHref(item.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-hub-foreground/8 text-hub-foreground"
                    : "text-hub-foreground/75 hover:bg-hub-foreground/[0.04] hover:text-hub-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-3.5 shrink-0 text-hub-foreground/55" />
                <span className="flex-1 truncate">{item.label}</span>
                {count > 0 && (
                  <span className="text-xs tabular-nums text-hub-foreground/50">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 my-2 border-t border-hub-foreground/8" role="separator" />

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <p className="px-2.5 py-1.5 text-xs font-semibold text-hub-foreground/55">
            Shared with me
          </p>

          {sharedProjects.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-hub-foreground/55">
              Projects you join will appear here.
            </p>
          ) : (
            <ul className="mt-0.5 space-y-0.5">
              {sharedProjects.map((project) => {
                const expanded = expandedProjects.has(project.id);

                return (
                  <li key={project.id}>
                    <div className="group flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => toggleProject(project.id)}
                        className="flex size-6 shrink-0 items-center justify-center rounded text-hub-foreground/50 transition-colors hover:bg-hub-foreground/6 hover:text-hub-foreground/75"
                        aria-label={expanded ? "Collapse project" : "Expand project"}
                        aria-expanded={expanded}
                      >
                        {expanded ? (
                          <ChevronDown className="size-3" />
                        ) : (
                          <ChevronRight className="size-3" />
                        )}
                      </button>
                      <Link
                        href={project.href}
                        className="min-w-0 flex-1 truncate rounded-md px-1 py-1 text-sm font-medium text-hub-foreground/90 transition-colors hover:bg-hub-foreground/[0.04] hover:text-hub-foreground"
                      >
                        {project.name}
                      </Link>
                    </div>

                    {expanded && project.files.length > 0 && (
                      <ul className="mt-0.5 ml-5 space-y-0.5 border-l border-hub-foreground/8 pl-2">
                        {project.files.map((file) => (
                          <SidebarFileRow
                            key={file.id}
                            file={file}
                            onOpenMenu={(x, y) =>
                              setContextMenu({
                                x,
                                y,
                                href: file.href,
                                label: file.name,
                              })
                            }
                          />
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <ProjectContextMenu
        open={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={
          contextMenu
            ? [
                {
                  id: "open",
                  label: "Open",
                  onSelect: () => {
                    window.location.href = contextMenu.href;
                  },
                },
                {
                  id: "new-tab",
                  label: "Open in new tab",
                  onSelect: () => {
                    window.open(contextMenu.href, "_blank", "noopener,noreferrer");
                  },
                },
              ]
            : []
        }
        onClose={() => setContextMenu(null)}
      />
    </>
  );
}

function SidebarFileRow({
  file,
  onOpenMenu,
}: {
  file: SharedProjectNode["files"][number];
  onOpenMenu: (x: number, y: number) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  const FileIcon = file.type === "canvas" ? PenTool : ClipboardList;

  return (
    <li>
      <div
        ref={rowRef}
        className="group/file flex items-start gap-1 rounded-md pr-1 transition-colors hover:bg-hub-foreground/[0.04]"
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
      >
        <Link
          href={file.href}
          className={cn(
            "min-w-0 flex-1 py-1 pl-1.5",
            !file.canOpen && "opacity-70",
          )}
        >
          <span className="flex items-center gap-1.5">
            <FileIcon className="size-3.5 shrink-0 text-hub-foreground/55" />
            <span className="truncate text-sm text-hub-foreground/90">
              {file.name}
            </span>
          </span>
          <span className="mt-0.5 block pl-5 text-xs text-hub-foreground/55">
            {fileTypeShortLabel(file.type)}
          </span>
        </Link>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const rect = rowRef.current?.getBoundingClientRect();
            onOpenMenu(
              rect ? rect.right - 8 : event.clientX,
              rect ? rect.top + 8 : event.clientY,
            );
          }}
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded text-hub-foreground/50 transition-opacity hover:bg-hub-foreground/8 hover:text-hub-foreground/75",
            showMenu ? "opacity-100" : "opacity-0 group-hover/file:opacity-100",
          )}
          aria-label={`Options for ${file.name}`}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
