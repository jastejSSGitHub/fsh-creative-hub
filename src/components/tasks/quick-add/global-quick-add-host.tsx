"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { CollaborationOnboardingModal } from "@/components/collaboration-onboarding/collaboration-onboarding-modal";
import { requestCollaborationOnboarding } from "@/lib/collaboration-onboarding/events";
import { shouldShowCollaborationOnboarding } from "@/lib/collaboration-onboarding/storage";
import { QuickAddPanel } from "@/components/tasks/quick-add/quick-add-panel";
import {
  OPEN_QUICK_ADD_REQUEST,
  QUICK_ADD_CAPTURE_CHANGED,
  consumeQuickAddCaptureContext,
} from "@/lib/tasks/capture-context";
import { createClient } from "@/lib/supabase/client";
import { getLabels, getUserProjectsForTasks } from "@/lib/tasks/queries";
import { isCanvasPath, projectIdFromPathname } from "@/lib/routes";
import type { HubLabel, HubProfile } from "@/types/database";
import { cn } from "@/lib/utils";

type GlobalQuickAddHostProps = {
  userId: string;
};

export function GlobalQuickAddHost({ userId }: GlobalQuickAddHostProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
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
      requestCollaborationOnboarding("smart-capture");
    }
  }, [pathProjectId]);

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
    void loadContext();
    applyCaptureContext();
    setOpen(true);
    if (shouldShowCollaborationOnboarding("global-quick-add", userId)) {
      setOnboardingOpen(true);
    }
  }, [applyCaptureContext, loadContext, userId]);

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
      <button
        type="button"
        onClick={openQuickAdd}
        className={cn(
          "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-12 items-center justify-center rounded-full",
          "bg-hub-foreground text-hub-paper shadow-lg transition-transform hover:scale-105 lg:bottom-6",
        )}
        aria-label="Quick add task (Q)"
      >
        <Plus className="size-5" strokeWidth={2.5} />
      </button>

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
        onCreated={() => setOpen(false)}
      />

      <CollaborationOnboardingModal
        featureId="global-quick-add"
        userId={userId}
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />
    </>
  );
}
