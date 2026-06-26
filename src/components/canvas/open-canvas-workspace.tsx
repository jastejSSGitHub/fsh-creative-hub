"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CanvasBottomToolbar } from "@/components/canvas/canvas-bottom-toolbar";
import { CanvasChrome } from "@/components/canvas/canvas-chrome";
import { CanvasNodesLayer } from "@/components/canvas/canvas-nodes-layer";
import { CanvasOnboarding } from "@/components/canvas/canvas-onboarding";
import { CanvasTemplatePicker } from "@/components/canvas/canvas-template-picker";
import { CanvasViewportSurface } from "@/components/canvas/canvas-viewport";
import { InviteMembersDialog } from "@/components/projects/invite-members-dialog";
import { useCanvasWorkspace } from "@/hooks/use-canvas-workspace";
import { useCanvasViewport } from "@/hooks/use-canvas-viewport";
import type { CanvasIntroStep } from "@/lib/canvas/onboarding-steps";
import { getCanvasTheme } from "@/lib/canvas/presets";
import type { StampId } from "@/lib/canvas/types";
import { parseViewport } from "@/lib/canvas/viewport";
import type { ProjectCardData } from "@/lib/projects/queries";
import type { HubProject, HubProjectFile } from "@/types/database";

type OpenCanvasWorkspaceProps = {
  project: HubProject;
  canvas: HubProjectFile;
  authorName: string;
  projectCard: ProjectCardData;
  currentUserId: string;
};

export function OpenCanvasWorkspace({
  project,
  canvas,
  authorName,
  projectCard,
  currentUserId,
}: OpenCanvasWorkspaceProps) {
  const {
    containerRef,
    viewport,
    tool,
    setTool,
    centerOnOrigin,
    resetView,
    zoomIn,
    zoomOut,
    cursor,
    handlers: viewportHandlers,
  } = useCanvasViewport({
    initialViewport: parseViewport(canvas.config as Record<string, unknown> | undefined),
  });

  const workspace = useCanvasWorkspace({
    projectId: project.id,
    canvasId: canvas.id,
    initialConfig: canvas.config as Record<string, unknown> | undefined,
    authorName,
    viewport,
  });

  const [stampPickerOpen, setStampPickerOpen] = useState(false);
  const [pendingStampId, setPendingStampId] = useState<StampId | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"design" | "brainstorm">("design");

  const stickyToolRef = useRef<HTMLButtonElement>(null);
  const stampToolRef = useRef<HTMLButtonElement>(null);
  const brainstormPanelRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  const theme = getCanvasTheme(workspace.backgroundColor);

  const handleOnboardingStepChange = useCallback((step: CanvasIntroStep) => {
    if (step === "timer") {
      setSidebarTab("brainstorm");
    }
  }, []);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      return {
        x: (clientX - rect.left - viewport.x) / viewport.zoom,
        y: (clientY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [containerRef, viewport.x, viewport.y, viewport.zoom],
  );

  function handleCanvasPlace(worldX: number, worldY: number) {
    if (workspace.placementTool === "sticky") {
      workspace.addStickyAt(worldX, worldY);
      return;
    }
    if (workspace.placementTool === "stamp" && pendingStampId) {
      workspace.addStampAt(worldX, worldY, pendingStampId);
      setPendingStampId(null);
    }
  }

  const mergedHandlers = {
    ...viewportHandlers,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (workspace.placementTool !== "select" && tool === "select" && event.button === 0) {
        const { x, y } = screenToWorld(event.clientX, event.clientY);
        handleCanvasPlace(x, y);
        event.preventDefault();
        return;
      }
      viewportHandlers.onPointerDown(event);
    },
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const inTextField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;

      if (event.key === "c" || event.key === "C") {
        if (inTextField) return;
        if (workspace.copySelectedSticky()) {
          event.preventDefault();
        }
        return;
      }

      if (event.key === "v" || event.key === "V") {
        if (inTextField) return;
        if (workspace.pasteSticky()) {
          event.preventDefault();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [workspace.copySelectedSticky, workspace.pasteSticky]);

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: workspace.backgroundColor }}
    >
      <CanvasViewportSurface
        containerRef={containerRef}
        viewport={viewport}
        backgroundColor={workspace.backgroundColor}
        theme={theme}
        cursor={workspace.placementTool !== "select" ? "crosshair" : cursor}
        showEmptyState={false}
        onDismissEmptyState={() => undefined}
        handlers={mergedHandlers}
        nodesLayer={
          <CanvasNodesLayer
            nodes={workspace.nodes}
            zoom={viewport.zoom}
            selectedId={workspace.selectedId}
            placementTool={workspace.placementTool}
            onSelect={workspace.setSelectedId}
            onCanvasPlace={handleCanvasPlace}
            onStickyTextChange={(id, text) =>
              workspace.updateStickyFormat(id, { text })
            }
            onStickyFormatChange={(id, patch) =>
              workspace.updateStickyFormat(id, patch)
            }
            onNodeDrag={workspace.moveNode}
            onAddAdjacentSticky={workspace.addAdjacentSticky}
            onSectionTitleChange={(id, title) =>
              workspace.updateNode(id, { title })
            }
          />
        }
      />

      <CanvasTemplatePicker
        open={workspace.templatePickerOpen}
        themeMode={theme.mode}
        onApplyHowMightWe={() => workspace.applyTemplate("how-might-we")}
        onStartEmpty={() => workspace.setTemplatePickerOpen(false)}
        onClose={() => workspace.setTemplatePickerOpen(false)}
      />

      <CanvasChrome
        canvasName={canvas.name}
        projectId={project.id}
        tool={tool}
        onToolChange={setTool}
        zoom={viewport.zoom}
        backgroundColor={workspace.backgroundColor}
        onBackgroundColorChange={workspace.setBackgroundColor}
        onCenter={centerOnOrigin}
        onResetView={resetView}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        sidebarTab={sidebarTab}
        onSidebarTabChange={setSidebarTab}
        brainstormPanelRef={brainstormPanelRef}
        shareButtonRef={shareButtonRef}
        onShare={() => setShareOpen(true)}
      />

      <CanvasBottomToolbar
        placementTool={workspace.placementTool}
        onPlacementToolChange={workspace.setPlacementTool}
        stampPickerOpen={stampPickerOpen}
        onStampPickerOpenChange={setStampPickerOpen}
        onStampSelect={setPendingStampId}
        themeMode={theme.mode}
        stickyToolRef={stickyToolRef}
        stampToolRef={stampToolRef}
      />

      <CanvasOnboarding
        canvasId={canvas.id}
        themeMode={theme.mode}
        targets={{
          stickyTool: stickyToolRef,
          stampTool: stampToolRef,
          brainstormPanel: brainstormPanelRef,
          shareButton: shareButtonRef,
        }}
        onStepChange={handleOnboardingStepChange}
        onShareClick={() => setShareOpen(true)}
      />

      <InviteMembersDialog
        project={shareOpen ? projectCard : null}
        currentUserId={currentUserId}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
