"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CanvasBottomToolbar } from "@/components/canvas/canvas-bottom-toolbar";
import { CanvasChrome } from "@/components/canvas/canvas-chrome";
import { CanvasFileDropOverlay } from "@/components/canvas/canvas-file-drop-overlay";
import { CanvasFontProvider } from "@/components/canvas/canvas-font-provider";
import { CanvasNodesLayer } from "@/components/canvas/canvas-nodes-layer";
import { CanvasOnboarding } from "@/components/canvas/canvas-onboarding";
import { CanvasTemplatePicker } from "@/components/canvas/canvas-template-picker";
import { CanvasViewportSurface } from "@/components/canvas/canvas-viewport";
import { InviteMembersDialog } from "@/components/projects/invite-members-dialog";
import { useCanvasWorkspace } from "@/hooks/use-canvas-workspace";
import { useCanvasFileDrop } from "@/hooks/use-canvas-file-drop";
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
  canRename: boolean;
};

export function OpenCanvasWorkspace({
  project,
  canvas,
  authorName,
  projectCard,
  currentUserId,
  canRename,
}: OpenCanvasWorkspaceProps) {
  const {
    containerRef,
    viewport,
    tool,
    setTool,
    centerOnOrigin,
    resetView,
    focusOnWorldPoint,
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
  const [stampPreviewWorld, setStampPreviewWorld] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [embedPreviewWorld, setEmbedPreviewWorld] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"design" | "brainstorm">("design");

  const stickyToolRef = useRef<HTMLButtonElement>(null);
  const textToolRef = useRef<HTMLButtonElement>(null);
  const stampToolRef = useRef<HTMLButtonElement>(null);
  const [focusTextId, setFocusTextId] = useState<string | null>(null);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const copyToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brainstormPanelRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  const theme = getCanvasTheme(workspace.backgroundColor);

  const handleOnboardingStepChange = useCallback((step: CanvasIntroStep) => {
    if (step === "timer") {
      setSidebarTab("brainstorm");
    }
  }, []);

  const showCopiedToast = useCallback(() => {
    setCopyToastVisible(true);
    if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    copyToastTimerRef.current = setTimeout(() => {
      setCopyToastVisible(false);
      copyToastTimerRef.current = null;
    }, 2000);
  }, []);

  const handleTextCopy = useCallback(
    (id: string) => {
      workspace.setSelectedId(id);
      if (workspace.copySelectedText()) {
        showCopiedToast();
      }
    },
    [showCopiedToast, workspace],
  );

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

  const fileDrop = useCanvasFileDrop({
    screenToWorld,
    onDropFiles: async (files, worldPoint, clientX, clientY) => {
      await workspace.dropImagesAt(
        files,
        worldPoint.x,
        worldPoint.y,
        clientX,
        clientY,
      );
    },
  });

  function handleCanvasPlace(
    worldX: number,
    worldY: number,
    clientX?: number,
    clientY?: number,
  ) {
    if (workspace.placementTool === "text") {
      const id = workspace.addTextAt(worldX, worldY);
      setFocusTextId(id);
      requestAnimationFrame(() => focusOnWorldPoint(worldX, worldY));
      return;
    }
    if (workspace.placementTool === "sticky") {
      workspace.addStickyAt(worldX, worldY);
      return;
    }
    if (workspace.placementTool === "stamp" && pendingStampId) {
      workspace.addStampAt(worldX, worldY, pendingStampId, clientX, clientY);
      setPendingStampId(null);
      setStampPreviewWorld(null);
      return;
    }
    if (workspace.placementTool === "embed") {
      workspace.addEmbedAt(worldX, worldY);
      setEmbedPreviewWorld(null);
    }
  }

  const updateStampPreview = useCallback(
    (clientX: number, clientY: number) => {
      if (!pendingStampId || workspace.placementTool !== "stamp") return;
      setStampPreviewWorld(screenToWorld(clientX, clientY));
    },
    [pendingStampId, screenToWorld, workspace.placementTool],
  );

  const updateEmbedPreview = useCallback(
    (clientX: number, clientY: number) => {
      if (workspace.placementTool !== "embed") return;
      setEmbedPreviewWorld(screenToWorld(clientX, clientY));
    },
    [screenToWorld, workspace.placementTool],
  );

  const cancelStampPlacement = useCallback(() => {
    setPendingStampId(null);
    setStampPreviewWorld(null);
    workspace.setPlacementTool("select");
  }, [workspace.setPlacementTool]);

  const cancelEmbedPlacement = useCallback(() => {
    setEmbedPreviewWorld(null);
    workspace.setPlacementTool("select");
  }, [workspace.setPlacementTool]);

  useEffect(() => {
    if (!pendingStampId || workspace.placementTool !== "stamp") return;

    function handlePointerMove(event: PointerEvent) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (inside) {
        setStampPreviewWorld(screenToWorld(event.clientX, event.clientY));
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [
    pendingStampId,
    workspace.placementTool,
    screenToWorld,
    containerRef,
  ]);

  useEffect(() => {
    if (workspace.placementTool !== "embed") return;

    function handlePointerMove(event: PointerEvent) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (inside) {
        setEmbedPreviewWorld(screenToWorld(event.clientX, event.clientY));
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [workspace.placementTool, screenToWorld, containerRef]);

  const mergedHandlers = {
    ...viewportHandlers,
    ...fileDrop.handlers,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (workspace.placementTool !== "select" && tool === "select" && event.button === 0) {
        const { x, y } = screenToWorld(event.clientX, event.clientY);
        handleCanvasPlace(x, y, event.clientX, event.clientY);
        event.preventDefault();
        return;
      }
      viewportHandlers.onPointerDown(event);
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      updateStampPreview(event.clientX, event.clientY);
      updateEmbedPreview(event.clientX, event.clientY);
      viewportHandlers.onPointerMove(event);
    },
    onPointerEnter: (event: React.PointerEvent<HTMLDivElement>) => {
      updateStampPreview(event.clientX, event.clientY);
      updateEmbedPreview(event.clientX, event.clientY);
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

      if (event.key === "Escape" && pendingStampId) {
        cancelStampPlacement();
        event.preventDefault();
        return;
      }

      if (event.key === "Escape" && workspace.placementTool === "embed") {
        cancelEmbedPlacement();
        event.preventDefault();
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !inTextField &&
        workspace.placementTool === "select"
      ) {
        if (workspace.deleteSelectedNode()) {
          event.preventDefault();
        }
        return;
      }

      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;

      if (event.key === "c" || event.key === "C") {
        if (inTextField) return;
        if (workspace.copySelectedNode()) {
          event.preventDefault();
        }
        return;
      }

      if (event.key === "v" || event.key === "V") {
        if (inTextField) return;
        if (workspace.pasteClipboard()) {
          event.preventDefault();
        }
        return;
      }

      if (event.key === "z" || event.key === "Z") {
        if (inTextField) return;
        if (event.shiftKey) {
          if (workspace.redo()) {
            event.preventDefault();
          }
        } else if (workspace.undo()) {
          event.preventDefault();
        }
        return;
      }

      if (event.key === "y" || event.key === "Y") {
        if (inTextField) return;
        if (workspace.redo()) {
          event.preventDefault();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    workspace.copySelectedNode,
    workspace.pasteClipboard,
    workspace.undo,
    workspace.redo,
    workspace.deleteSelectedNode,
    workspace.placementTool,
    pendingStampId,
    cancelStampPlacement,
    cancelEmbedPlacement,
  ]);

  return (
    <CanvasFontProvider>
    <div
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: workspace.backgroundColor }}
    >
      <CanvasViewportSurface
        containerRef={containerRef}
        viewport={viewport}
        backgroundColor={workspace.backgroundColor}
        theme={theme}
        cursor={
          pendingStampId && workspace.placementTool === "stamp"
            ? "none"
            : workspace.placementTool === "embed"
              ? "none"
            : workspace.placementTool !== "select"
              ? "crosshair"
              : cursor
        }
        showEmptyState={false}
        onDismissEmptyState={() => undefined}
        handlers={mergedHandlers}
        dropOverlay={
          <CanvasFileDropOverlay active={fileDrop.active} theme={theme} />
        }
        nodesLayer={
          <CanvasNodesLayer
            nodes={workspace.nodes}
            zoom={viewport.zoom}
            selectedIds={workspace.selectedIds}
            viewportTool={tool}
            placementTool={workspace.placementTool}
            pendingStampId={pendingStampId}
            stampPreviewWorld={stampPreviewWorld}
            embedPreviewWorld={embedPreviewWorld}
            fileDropPreviewWorld={fileDrop.active ? fileDrop.worldPoint : null}
            recentDropIds={workspace.recentDropIds}
            onSelectNode={workspace.selectNode}
            onSelectNodes={workspace.selectNodes}
            onClearSelection={workspace.clearSelection}
            onCanvasPlace={handleCanvasPlace}
            clientToWorld={screenToWorld}
            onStartEmbedPlacement={workspace.startEmbedPlacement}
            onStickyTextChange={(id, text) =>
              workspace.updateStickyFormat(id, { text })
            }
            onStickyFormatChange={(id, patch) =>
              workspace.updateStickyFormat(id, patch)
            }
            onEmbedUpdate={(id, patch) => workspace.updateEmbedNode(id, patch)}
            onStickyUpdate={(id, patch) => workspace.updateNode(id, patch)}
            onNodeDrag={workspace.moveNode}
            onStampDragEnd={workspace.finalizeStampAttachment}
            onNodeDelete={workspace.deleteNode}
            onStampDuplicate={workspace.duplicateStamp}
            onSectionDrag={workspace.moveSection}
            onAddAdjacentSticky={workspace.addAdjacentSticky}
            onSectionTitleChange={(id, title) =>
              workspace.updateSectionTitle(id, title)
            }
            onHistoryGestureStart={workspace.beginHistoryGesture}
            onHistoryGestureEnd={workspace.endHistoryGesture}
            canPasteClipboard={workspace.canPasteClipboard}
            onPasteAt={workspace.pasteClipboardAt}
            focusTextId={focusTextId}
            onFocusTextHandled={() => setFocusTextId(null)}
            onTextChange={(id, text) => workspace.updateTextFormat(id, { text })}
            onTextFormatChange={(id, patch) => workspace.updateTextFormat(id, patch)}
            onTextUpdate={(id, patch) => workspace.updateNode(id, patch)}
            onTextCopy={handleTextCopy}
            onTextDuplicate={workspace.duplicateText}
            onEmbedDuplicate={workspace.duplicateEmbed}
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
        canvasId={canvas.id}
        canvasName={canvas.name}
        projectId={project.id}
        canRename={canRename}
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
        textToolRef={textToolRef}
        stickyToolRef={stickyToolRef}
        stampToolRef={stampToolRef}
        canUndo={workspace.canUndo}
        canRedo={workspace.canRedo}
        onUndo={workspace.undo}
        onRedo={workspace.redo}
        onStartEmbedPlacement={workspace.startEmbedPlacement}
        onCancelEmbedPlacement={cancelEmbedPlacement}
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

      {copyToastVisible ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-6 z-50 rounded-full border border-white/15 bg-[#1a1a1a]/92 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
        >
          Copied
        </div>
      ) : null}
    </div>
    </CanvasFontProvider>
  );
}
