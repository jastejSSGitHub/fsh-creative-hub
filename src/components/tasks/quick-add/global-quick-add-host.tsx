"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FolderPlus, ListPlus, Plus } from "lucide-react";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { markCollaborationOnboardingSeen } from "@/lib/collaboration-onboarding/storage";
import { QuickAddPanel } from "@/components/tasks/quick-add/quick-add-panel";
import {
  OPEN_QUICK_ADD_REQUEST,
  QUICK_ADD_CAPTURE_CHANGED,
  consumeQuickAddCaptureContext,
  setQuickAddOpenState,
} from "@/lib/tasks/capture-context";
import { createClient } from "@/lib/supabase/client";
import { getLabels, getUserProjectsForTasks } from "@/lib/tasks/queries";
import { isCanvasPath, isProjectsGridPath, projectIdFromPathname } from "@/lib/routes";
import type { HubLabel, HubProfile } from "@/types/database";
import { cn } from "@/lib/utils";

type GlobalQuickAddHostProps = {
  userId: string;
};

export function GlobalQuickAddHost({ userId }: GlobalQuickAddHostProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [labels, setLabels] = useState<HubLabel[]>([]);
  const [members, setMembers] = useState<Pick<HubProfile, "id" | "display_name">[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [captureProjectId, setCaptureProjectId] = useState<string | null | undefined>(
    undefined,
  );
  const [captureInitialValue, setCaptureInitialValue] = useState("");
  const [linkAssetId, setLinkAssetId] = useState<string | null>(null);

  const hidden = isCanvasPath(pathname);
  const onProjectsGrid = isProjectsGridPath(pathname);
  const pathProjectId = projectIdFromPathname(pathname);

  const applyCaptureContext = useCallback(() => {
    const ctx = consumeQuickAddCaptureContext();
    if (!ctx) {
      setCaptureProjectId(undefined);
      setCaptureInitialValue("");
      setLinkAssetId(null);
      return;
    }
    setCaptureProjectId(ctx.projectId ?? pathProjectId);
    setCaptureInitialValue(ctx.initialValue ?? "");
    setLinkAssetId(ctx.linkAssetOnCreate ? (ctx.assetId ?? null) : null);
    if (ctx.projectId || ctx.assetId) {
      markCollaborationOnboardingSeen("smart-capture", userId, true);
      markCollaborationOnboardingSeen("global-quick-add", userId, true);
    }
  }, [pathProjectId, userId]);

  const loadContext = useCallback(async () => {
    if (loaded) return;
    const supabase = createClient();
    const [projectList, labelList, { data: profiles }] = await Promise.all([
      getUserProjectsForTasks(supabase),
      getLabels(supabase),
      supabase.from("hub_profiles").select("id, display_name").order("display_name"),
    ]);
    setProjects(projectList);
    setLabels(labelList);
    setMembers(profiles ?? []);
    setLoaded(true);
  }, [loaded]);

  const openQuickAdd = useCallback(() => {
    setFabMenuOpen(false);
    void loadContext();
    applyCaptureContext();
    setOpen(true);
    markCollaborationOnboardingSeen("global-quick-add", userId, true);
  }, [applyCaptureContext, loadContext, userId]);

  const handleFabClick = useCallback(() => {
    if (onProjectsGrid) {
      setFabMenuOpen((current) => !current);
      return;
    }
    openQuickAdd();
  }, [onProjectsGrid, openQuickAdd]);

  useEffect(() => {
    setFabMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setQuickAddOpenState(open);
    return () => setQuickAddOpenState(false);
  }, [open]);

  useEffect(() => {
    if (hidden) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "q") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      openQuickAdd();
    }

    function onOpenRequest() {
      openQuickAdd();
    }

    function onCaptureChanged() {
      if (open) applyCaptureContext();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_QUICK_ADD_REQUEST, onOpenRequest);
    window.addEventListener(QUICK_ADD_CAPTURE_CHANGED, onCaptureChanged);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_QUICK_ADD_REQUEST, onOpenRequest);
      window.removeEventListener(QUICK_ADD_CAPTURE_CHANGED, onCaptureChanged);
    };
  }, [applyCaptureContext, hidden, open, openQuickAdd]);

  if (hidden) return null;

  const defaultProjectId =
    captureProjectId !== undefined ? captureProjectId : pathProjectId;

  return (
    <>
      {onProjectsGrid && fabMenuOpen ? (
        <button
          type="button"
          aria-label="Close create menu"
          className="fixed inset-0 z-[39] bg-hub-foreground/[0.14] backdrop-blur-sm transition-[backdrop-filter,background-color] duration-200"
          onClick={() => setFabMenuOpen(false)}
        />
      ) : null}

      <div
        data-hub-mobile-chrome
        className={cn(
          "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-2 transition-[filter] duration-200 lg:bottom-6",
        )}
      >
        {onProjectsGrid && fabMenuOpen ? (
          <div
            className="flex flex-col items-end gap-2"
            role="menu"
            aria-label="Create options"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setFabMenuOpen(false);
                setCreateProjectOpen(true);
              }}
              className="flex items-center gap-2.5"
            >
              <span className="rounded-lg border border-hub-foreground/12 bg-hub-paper/92 px-3 py-1.5 text-[0.8125rem] font-medium text-hub-foreground shadow-md backdrop-blur-md">
                Add new project
              </span>
              <span className="flex size-10 items-center justify-center rounded-full border border-hub-foreground/12 bg-hub-paper/92 text-hub-foreground shadow-lg backdrop-blur-md transition-transform hover:scale-105">
                <FolderPlus className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={openQuickAdd}
              className="flex items-center gap-2.5"
            >
              <span className="rounded-lg border border-hub-foreground/12 bg-hub-paper/92 px-3 py-1.5 text-[0.8125rem] font-medium text-hub-foreground shadow-md backdrop-blur-md">
                Quick task
              </span>
              <span className="flex size-10 items-center justify-center rounded-full bg-hub-primary text-white shadow-lg shadow-hub-primary/30 backdrop-blur-md transition-transform hover:scale-105">
                <ListPlus className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleFabClick}
          aria-expanded={onProjectsGrid ? fabMenuOpen : undefined}
          aria-haspopup={onProjectsGrid ? "menu" : undefined}
          aria-label={
            onProjectsGrid
              ? fabMenuOpen
                ? "Close create menu"
                : "Open create menu"
              : "Quick add task (Q)"
          }
          className={cn(
            "flex size-12 items-center justify-center rounded-full bg-hub-primary text-white shadow-lg shadow-hub-primary/25 transition-transform hover:scale-105 hover:bg-[#1590e8]",
            fabMenuOpen && "rotate-45",
          )}
        >
          <Plus className="size-5" strokeWidth={2.5} aria-hidden />
        </button>
      </div>

      {onProjectsGrid ? (
        <CreateProjectDialog
          open={createProjectOpen}
          onClose={() => setCreateProjectOpen(false)}
        />
      ) : null}

      <QuickAddPanel
        open={open}
        onClose={() => {
          setOpen(false);
          setCaptureProjectId(undefined);
          setCaptureInitialValue("");
          setLinkAssetId(null);
        }}
        projects={projects}
        labels={labels}
        members={members}
        defaultProjectId={defaultProjectId}
        initialValue={captureInitialValue}
        linkAssetId={linkAssetId}
      />

    </>
  );
}
