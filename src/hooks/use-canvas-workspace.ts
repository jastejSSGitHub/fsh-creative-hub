"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { saveCanvasConfigAction } from "@/lib/canvas/actions";
import { parseCanvasConfig } from "@/lib/canvas/parse-config";
import { DEFAULT_CANVAS_BG } from "@/lib/canvas/presets";
import { createHowMightWeTemplate } from "@/lib/canvas/templates";
import type {
  CanvasConfigV1,
  CanvasNode,
  CanvasPlacementTool,
  CanvasTextSize,
  StampId,
  StickyColorId,
  StickyNode,
} from "@/lib/canvas/types";
import {
  STAMP_SIZE,
  STICKY_GAP,
  STICKY_HEIGHT,
  STICKY_WIDTH,
} from "@/lib/canvas/presets";
import { snapStickyToSection, getSectionNodes } from "@/lib/canvas/snap";
import type { CanvasViewport } from "@/lib/canvas/viewport";
import { fireConfetti } from "@/lib/confetti";

type UseCanvasWorkspaceOptions = {
  projectId: string;
  canvasId: string;
  initialConfig: Record<string, unknown> | undefined;
  authorName: string;
  viewport: CanvasViewport;
};

function newSticky(
  x: number,
  y: number,
  authorName: string,
  sectionId?: string,
): StickyNode {
  return {
    id: `sticky-${crypto.randomUUID()}`,
    type: "sticky",
    x,
    y,
    width: STICKY_WIDTH,
    height: STICKY_HEIGHT,
    text: "",
    color: "yellow",
    textSize: "small",
    bold: false,
    strikethrough: false,
    authorName,
    sectionId,
  };
}

function cloneSticky(
  source: StickyNode,
  x: number,
  y: number,
  authorName: string,
): StickyNode {
  return {
    ...source,
    id: `sticky-${crypto.randomUUID()}`,
    x,
    y,
    authorName,
  };
}

export function useCanvasWorkspace({
  projectId,
  canvasId,
  initialConfig,
  authorName,
  viewport,
}: UseCanvasWorkspaceOptions) {
  const parsed = parseCanvasConfig(initialConfig);
  const [nodes, setNodes] = useState<CanvasNode[]>(parsed.nodes);
  const [backgroundColor, setBackgroundColor] = useState(
    parsed.backgroundColor ?? DEFAULT_CANVAS_BG,
  );
  const [placementTool, setPlacementTool] =
    useState<CanvasPlacementTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(
    () => parsed.nodes.length === 0 && !parsed.templateApplied,
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(nodes);
  const stickyClipboardRef = useRef<StickyNode | null>(null);
  nodesRef.current = nodes;

  const persist = useCallback(
    (patch: Partial<CanvasConfigV1>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const config: CanvasConfigV1 = {
          version: 1,
          nodes: nodesRef.current,
          viewport,
          backgroundColor,
          ...patch,
        };
        void saveCanvasConfigAction(projectId, canvasId, config);
      }, 800);
    },
    [backgroundColor, canvasId, projectId, viewport],
  );

  useEffect(() => {
    persist({});
  }, [nodes, backgroundColor, viewport, persist]);

  const applyTemplate = useCallback((templateId: "how-might-we") => {
    const templateNodes = createHowMightWeTemplate();
    setNodes(templateNodes);
    setTemplatePickerOpen(false);
    persist({ templateApplied: templateId, nodes: templateNodes });
  }, [persist]);

  const updateNode = useCallback((id: string, patch: Partial<CanvasNode>) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? ({ ...node, ...patch } as CanvasNode) : node,
      ),
    );
  }, []);

  const addStickyAt = useCallback(
    (worldX: number, worldY: number) => {
      const sections = getSectionNodes(nodesRef.current);
      const snap = snapStickyToSection(
        worldX - STICKY_WIDTH / 2,
        worldY - STICKY_HEIGHT / 2,
        sections,
      );
      const sticky = newSticky(snap.x, snap.y, authorName, snap.sectionId);
      setNodes((current) => [...current, sticky]);
      setSelectedId(sticky.id);
      setPlacementTool("select");
      return sticky.id;
    },
    [authorName],
  );

  const addStampAt = useCallback(
    (worldX: number, worldY: number, stampId: StampId) => {
      const stamp: CanvasNode = {
        id: `stamp-${crypto.randomUUID()}`,
        type: "stamp",
        x: worldX - STAMP_SIZE / 2,
        y: worldY - STAMP_SIZE / 2,
        width: STAMP_SIZE,
        height: STAMP_SIZE,
        stampId,
      };
      setNodes((current) => [...current, stamp]);
      setSelectedId(stamp.id);
      setPlacementTool("select");
      fireConfetti();
    },
    [],
  );

  const addAdjacentSticky = useCallback(
    (sourceId: string, side: "top" | "right" | "bottom" | "left") => {
      const source = nodesRef.current.find(
        (n): n is StickyNode => n.id === sourceId && n.type === "sticky",
      );
      if (!source) return;

      const offset = {
        top: [0, -(STICKY_HEIGHT + STICKY_GAP)] as const,
        bottom: [0, STICKY_HEIGHT + STICKY_GAP] as const,
        left: [-STICKY_WIDTH - STICKY_GAP, 0] as const,
        right: [STICKY_WIDTH + STICKY_GAP, 0] as const,
      };
      const [dx, dy] = offset[side];
      const sticky = newSticky(
        source.x + dx,
        source.y + dy,
        authorName,
        source.sectionId,
      );
      setNodes((current) => [...current, sticky]);
      setSelectedId(sticky.id);
    },
    [authorName],
  );

  const updateStickyFormat = useCallback(
    (
      id: string,
      patch: Partial<{
        color: StickyColorId;
        textSize: CanvasTextSize;
        bold: boolean;
        strikethrough: boolean;
        text: string;
      }>,
    ) => {
      updateNode(id, patch);
    },
    [updateNode],
  );

  const moveNode = useCallback((id: string, x: number, y: number) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;

    if (node.type === "sticky") {
      const sections = getSectionNodes(nodesRef.current);
      const snap = snapStickyToSection(x, y, sections);
      updateNode(id, { x: snap.x, y: snap.y, sectionId: snap.sectionId });
      return;
    }

    updateNode(id, { x, y });
  }, [updateNode]);

  const deleteNode = useCallback((id: string) => {
    setNodes((current) => current.filter((n) => n.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const copySelectedSticky = useCallback(() => {
    const selected = selectedId
      ? nodesRef.current.find(
          (n): n is StickyNode => n.id === selectedId && n.type === "sticky",
        )
      : null;
    if (!selected) return false;
    stickyClipboardRef.current = { ...selected };
    return true;
  }, [selectedId]);

  const pasteSticky = useCallback(() => {
    const source = stickyClipboardRef.current;
    if (!source) return false;

    const sections = getSectionNodes(nodesRef.current);
    const snap = snapStickyToSection(
      source.x + STICKY_GAP,
      source.y + STICKY_GAP,
      sections,
    );
    const sticky = cloneSticky(source, snap.x, snap.y, authorName);
    sticky.sectionId = snap.sectionId;

    setNodes((current) => [...current, sticky]);
    setSelectedId(sticky.id);
    return true;
  }, [authorName]);

  return {
    nodes,
    backgroundColor,
    setBackgroundColor,
    placementTool,
    setPlacementTool,
    selectedId,
    setSelectedId,
    templatePickerOpen,
    setTemplatePickerOpen,
    applyTemplate,
    addStickyAt,
    addStampAt,
    addAdjacentSticky,
    updateStickyFormat,
    moveNode,
    updateNode,
    deleteNode,
    copySelectedSticky,
    pasteSticky,
  };
}
