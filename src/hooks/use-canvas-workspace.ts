"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { saveCanvasConfigAction } from "@/lib/canvas/actions";
import type { CanvasHistorySnapshot } from "@/lib/canvas/history";
import { parseCanvasConfig } from "@/lib/canvas/parse-config";
import { DEFAULT_CANVAS_BG } from "@/lib/canvas/presets";
import { createHowMightWeTemplate } from "@/lib/canvas/templates";
import {
  EMBED_HEIGHT,
  EMBED_WIDTH,
  IMAGE_DEFAULT_MAX_HEIGHT,
  IMAGE_DEFAULT_MAX_WIDTH,
  IMAGE_DROP_STAGGER,
  STAMP_SIZE,
  STICKY_GAP,
  STICKY_HEIGHT,
  STICKY_WIDTH,
} from "@/lib/canvas/presets";
import {
  TEXT_DEFAULT_HEIGHT,
  TEXT_DEFAULT_WIDTH,
} from "@/lib/canvas/text-presets";
import type {
  CanvasConfigV1,
  CanvasNode,
  CanvasPlacementTool,
  CanvasTextSize,
  EmbedNode,
  ImageNode,
  StampId,
  StampNode,
  StickyColorId,
  StickyNode,
  TextNode,
} from "@/lib/canvas/types";
import { snapNodeToSection, snapStickyToSection, getSectionNodes } from "@/lib/canvas/snap";
import { resolveImagePlacement } from "@/lib/canvas/image-placement";
import {
  fitImageDimensions,
  loadImageDimensionsFromFile,
  uploadCanvasImage,
} from "@/lib/canvas/image-upload";
import {
  findAttachedStickyId,
  getStickyNodes,
  resolveStampPlacement,
} from "@/lib/canvas/stamp-attachment";
import type { CanvasViewport } from "@/lib/canvas/viewport";
import { resolveDevBypassDisplayName } from "@/lib/dev-auth";
import { fireSubtleConfetti } from "@/lib/confetti";
import { useCanvasHistory } from "@/hooks/use-canvas-history";

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

function newText(x: number, y: number, sectionId?: string): TextNode {
  return {
    id: `text-${crypto.randomUUID()}`,
    type: "text",
    x,
    y,
    width: TEXT_DEFAULT_WIDTH,
    height: TEXT_DEFAULT_HEIGHT,
    text: "",
    color: "#ffffff",
    fontFamily: "geist-sans",
    textSize: "medium",
    letterSpacing: "normal",
    lineHeight: "normal",
    align: "left",
    bold: false,
    italic: false,
    underline: false,
    uppercase: false,
    lowercase: false,
    sectionId,
  };
}

function cloneText(source: TextNode, x: number, y: number): TextNode {
  return {
    ...source,
    id: `text-${crypto.randomUUID()}`,
    x,
    y,
  };
}

const STAMP_DUPLICATE_OFFSET = 12;

function cloneStamp(source: StampNode, x: number, y: number): StampNode {
  return {
    ...source,
    id: `stamp-${crypto.randomUUID()}`,
    x,
    y,
    attachedStickyId: undefined,
  };
}

function cloneEmbed(source: EmbedNode, x: number, y: number): EmbedNode {
  return {
    ...source,
    id: `embed-${crypto.randomUUID()}`,
    x,
    y,
  };
}

function stampRect(stamp: Pick<StampNode, "x" | "y" | "width" | "height">) {
  return {
    x: stamp.x,
    y: stamp.y,
    width: stamp.width,
    height: stamp.height,
  };
}

function getPersistableCanvasNodes(nodes: CanvasNode[]): CanvasNode[] {
  return nodes.filter(
    (node) => !(node.type === "image" && node.uploadStatus === "uploading"),
  );
}

function normalizeCanvasNodes(
  nodes: CanvasNode[],
  currentAuthorName: string,
): CanvasNode[] {
  return nodes.map((node) => {
    if (node.type !== "sticky") return node;

    const resolvedAuthorName = resolveDevBypassDisplayName(node.authorName);
    const authorName =
      resolvedAuthorName === node.authorName
        ? node.authorName
        : currentAuthorName || resolvedAuthorName;

    if (authorName === node.authorName) return node;
    return { ...node, authorName };
  });
}

export function useCanvasWorkspace({
  projectId,
  canvasId,
  initialConfig,
  authorName,
  viewport,
}: UseCanvasWorkspaceOptions) {
  const parsed = parseCanvasConfig(initialConfig);
  const [nodes, setNodes] = useState<CanvasNode[]>(() =>
    normalizeCanvasNodes(parsed.nodes, authorName),
  );
  const [backgroundColor, setBackgroundColor] = useState(
    parsed.backgroundColor ?? DEFAULT_CANVAS_BG,
  );
  const [placementTool, setPlacementTool] =
    useState<CanvasPlacementTool>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds[selectedIds.length - 1] ?? null;
  const [recentDropIds, setRecentDropIds] = useState<string[]>([]);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(
    () => parsed.nodes.length === 0 && !parsed.templateApplied,
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(nodes);
  const backgroundColorRef = useRef(backgroundColor);
  const stickyClipboardRef = useRef<StickyNode | null>(null);
  const textClipboardRef = useRef<TextNode | null>(null);
  nodesRef.current = nodes;
  backgroundColorRef.current = backgroundColor;

  const getHistorySnapshot = useCallback(
    (): CanvasHistorySnapshot => ({
      nodes: nodesRef.current,
      backgroundColor: backgroundColorRef.current,
    }),
    [],
  );

  const applyHistorySnapshot = useCallback((snapshot: CanvasHistorySnapshot) => {
    setNodes(snapshot.nodes);
    setBackgroundColor(snapshot.backgroundColor);
    nodesRef.current = snapshot.nodes;
    backgroundColorRef.current = snapshot.backgroundColor;
    setSelectedIds([]);
  }, []);

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIds(id ? [id] : []);
  }, []);

  const selectNodes = useCallback(
    (ids: string[], options?: { additive?: boolean }) => {
      if (options?.additive) {
        setSelectedIds((current) => {
          const next = new Set([...current, ...ids]);
          return [...next];
        });
        return;
      }
      setSelectedIds(ids);
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectNode = useCallback(
    (id: string, options?: { additive?: boolean }) => {
      if (options?.additive) {
        setSelectedIds((current) =>
          current.includes(id)
            ? current.filter((entry) => entry !== id)
            : [...current, id],
        );
        return;
      }
      setSelectedIds([id]);
    },
    [],
  );

  const history = useCanvasHistory({
    getSnapshot: getHistorySnapshot,
    applySnapshot: applyHistorySnapshot,
  });

  const persist = useCallback(
    (patch: Partial<CanvasConfigV1>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const config: CanvasConfigV1 = {
          version: 1,
          nodes: getPersistableCanvasNodes(nodesRef.current),
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
    history.recordHistory();
    const templateNodes = createHowMightWeTemplate();
    setNodes(templateNodes);
    setTemplatePickerOpen(false);
    persist({ templateApplied: templateId, nodes: templateNodes });
  }, [history, persist]);

  const updateNode = useCallback((id: string, patch: Partial<CanvasNode>) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? ({ ...node, ...patch } as CanvasNode) : node,
      ),
    );
  }, []);

  const addStickyAt = useCallback(
    (worldX: number, worldY: number) => {
      history.recordHistory();
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
    [authorName, history],
  );

  const addTextAt = useCallback((worldX: number, worldY: number) => {
    history.recordHistory();
    const sections = getSectionNodes(nodesRef.current);
    const snap = snapNodeToSection(
      worldX - TEXT_DEFAULT_WIDTH / 2,
      worldY - TEXT_DEFAULT_HEIGHT / 2,
      TEXT_DEFAULT_WIDTH,
      TEXT_DEFAULT_HEIGHT,
      sections,
    );
    const textNode = newText(snap.x, snap.y, snap.sectionId);
    setNodes((current) => [...current, textNode]);
    setSelectedId(textNode.id);
    setPlacementTool("select");
    return textNode.id;
  }, [history]);

  const addStampAt = useCallback(
    (
      worldX: number,
      worldY: number,
      stampId: StampId,
      clientX?: number,
      clientY?: number,
    ) => {
      history.recordHistory();
      const stickies = getStickyNodes(nodesRef.current);
      const center = resolveStampPlacement(
        { x: worldX, y: worldY },
        stickies,
        STAMP_SIZE,
      );
      const x = center.x - STAMP_SIZE / 2;
      const y = center.y - STAMP_SIZE / 2;
      const attachedStickyId = findAttachedStickyId(
        { x, y, width: STAMP_SIZE, height: STAMP_SIZE },
        stickies,
      );

      const stamp: StampNode = {
        id: `stamp-${crypto.randomUUID()}`,
        type: "stamp",
        x,
        y,
        width: STAMP_SIZE,
        height: STAMP_SIZE,
        stampId,
        attachedStickyId,
      };
      setNodes((current) => [...current, stamp]);
      setSelectedId(stamp.id);
      setPlacementTool("select");
      fireSubtleConfetti(clientX, clientY);
    },
    [history],
  );

  const addEmbedAt = useCallback((worldX: number, worldY: number) => {
    history.recordHistory();
    const embed: EmbedNode = {
      id: `embed-${crypto.randomUUID()}`,
      type: "embed",
      x: worldX - EMBED_WIDTH / 2,
      y: worldY - EMBED_HEIGHT / 2,
      width: EMBED_WIDTH,
      height: EMBED_HEIGHT,
    };
    setNodes((current) => [...current, embed]);
    setSelectedId(embed.id);
    setPlacementTool("select");
    return embed.id;
  }, [history]);

  const markRecentDrop = useCallback((id: string) => {
    setRecentDropIds((current) => [...current, id]);
    window.setTimeout(() => {
      setRecentDropIds((current) => current.filter((entry) => entry !== id));
    }, 650);
  }, []);

  const addImageAt = useCallback(
    async (
      worldX: number,
      worldY: number,
      file: File,
      clientX?: number,
      clientY?: number,
      indexOffset = 0,
    ) => {
      const id = `image-${crypto.randomUUID()}`;
      const centerX = worldX + indexOffset * IMAGE_DROP_STAGGER;
      const centerY = worldY + indexOffset * IMAGE_DROP_STAGGER;

      const defaultPlacement = resolveImagePlacement(
        centerX,
        centerY,
        IMAGE_DEFAULT_MAX_WIDTH,
        IMAGE_DEFAULT_MAX_HEIGHT,
        nodesRef.current,
      );

      const placeholder: ImageNode = {
        id,
        type: "image",
        x: defaultPlacement.x,
        y: defaultPlacement.y,
        width: IMAGE_DEFAULT_MAX_WIDTH,
        height: IMAGE_DEFAULT_MAX_HEIGHT,
        imageUrl: "",
        uploadStatus: "uploading",
      };

      setNodes((current) => {
        const next = [...current, placeholder];
        nodesRef.current = next;
        return next;
      });
      setSelectedId(id);
      setPlacementTool("select");
      markRecentDrop(id);

      let naturalWidth = IMAGE_DEFAULT_MAX_WIDTH;
      let naturalHeight = IMAGE_DEFAULT_MAX_HEIGHT;

      try {
        const dimensions = await loadImageDimensionsFromFile(file);
        naturalWidth = dimensions.width;
        naturalHeight = dimensions.height;

        const { width, height } = fitImageDimensions(
          naturalWidth,
          naturalHeight,
          IMAGE_DEFAULT_MAX_WIDTH,
          IMAGE_DEFAULT_MAX_HEIGHT,
        );
        const placement = resolveImagePlacement(
          centerX,
          centerY,
          width,
          height,
          nodesRef.current.filter((node) => node.id !== id),
        );

        setNodes((current) => {
          const existing = current.find((node) => node.id === id);
          if (!existing || existing.type !== "image") return current;

          const next = current.map((node) =>
            node.id === id
              ? {
                  ...node,
                  x: placement.x,
                  y: placement.y,
                  width,
                  height,
                  naturalWidth,
                  naturalHeight,
                }
              : node,
          );
          nodesRef.current = next;
          return next;
        });
      } catch {
        // Keep default placeholder dimensions if the file cannot be measured.
      }

      const upload = await uploadCanvasImage(projectId, canvasId, file);
      if (!upload.ok) {
        setNodes((current) => {
          const next = current.filter((node) => node.id !== id);
          nodesRef.current = next;
          return next;
        });
        return null;
      }

      setNodes((current) => {
        const existing = current.find((node) => node.id === id);
        if (!existing || existing.type !== "image") return current;

        const next = current.map((node) =>
          node.id === id && node.type === "image"
            ? {
                ...node,
                imageUrl: upload.publicUrl,
                storagePath: upload.storagePath,
                uploadStatus: undefined,
              }
            : node,
        );
        nodesRef.current = next;
        return next;
      });

      fireSubtleConfetti(clientX, clientY);
      return id;
    },
    [canvasId, markRecentDrop, projectId],
  );

  const dropImagesAt = useCallback(
    async (
      files: File[],
      worldX: number,
      worldY: number,
      clientX?: number,
      clientY?: number,
    ) => {
      let lastId: string | null = null;
      history.recordHistory();
      for (let index = 0; index < files.length; index++) {
        const id = await addImageAt(
          worldX,
          worldY,
          files[index]!,
          index === 0 ? clientX : undefined,
          index === 0 ? clientY : undefined,
          index,
        );
        if (id) lastId = id;
      }
      return lastId;
    },
    [addImageAt, history],
  );

  const startEmbedPlacement = useCallback(() => {
    setSelectedId(null);
    setPlacementTool("embed");
  }, []);

  const addAdjacentSticky = useCallback(
    (sourceId: string, side: "top" | "right" | "bottom" | "left") => {
      const source = nodesRef.current.find(
        (n): n is StickyNode => n.id === sourceId && n.type === "sticky",
      );
      if (!source) return;

      history.recordHistory();
      const offset = {
        top: [0, -(source.height + STICKY_GAP)] as const,
        bottom: [0, source.height + STICKY_GAP] as const,
        left: [-source.width - STICKY_GAP, 0] as const,
        right: [source.width + STICKY_GAP, 0] as const,
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
    [authorName, history],
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
      const keys = Object.keys(patch);
      if (keys.length === 1 && keys[0] === "text") {
        history.recordTextHistoryBurst();
      } else {
        history.recordHistory();
      }
      updateNode(id, patch);
    },
    [history, updateNode],
  );

  const updateTextFormat = useCallback(
    (id: string, patch: Partial<TextNode>) => {
      if ("text" in patch && Object.keys(patch).length === 1) {
        history.recordTextHistoryBurst();
      } else {
        history.recordHistory();
      }
      updateNode(id, patch);
    },
    [history, updateNode],
  );

  const moveNode = useCallback((id: string, x: number, y: number) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;

    if (node.type === "sticky") {
      const sections = getSectionNodes(nodesRef.current);
      const snap = snapStickyToSection(x, y, sections);
      const dx = snap.x - node.x;
      const dy = snap.y - node.y;

      if (dx === 0 && dy === 0 && snap.sectionId === node.sectionId) {
        return;
      }

      setNodes((current) =>
        current.map((entry) => {
          if (entry.id === id) {
            return { ...entry, x: snap.x, y: snap.y, sectionId: snap.sectionId };
          }

          if (entry.type === "stamp" && entry.attachedStickyId === id) {
            return { ...entry, x: entry.x + dx, y: entry.y + dy };
          }

          return entry;
        }),
      );
      return;
    }

    if (node.type === "text") {
      const sections = getSectionNodes(nodesRef.current);
      const snap = snapNodeToSection(x, y, node.width, node.height, sections);

      if (snap.x === node.x && snap.y === node.y && snap.sectionId === node.sectionId) {
        return;
      }

      updateNode(id, { x: snap.x, y: snap.y, sectionId: snap.sectionId });
      return;
    }

    if (node.type === "stamp") {
      const center = {
        x: x + node.width / 2,
        y: y + node.height / 2,
      };
      const stickies = getStickyNodes(nodesRef.current);
      const snapped = resolveStampPlacement(center, stickies, STAMP_SIZE);
      updateNode(id, {
        x: snapped.x - node.width / 2,
        y: snapped.y - node.height / 2,
      });
      return;
    }

    updateNode(id, { x, y });
  }, [updateNode]);

  const finalizeStampAttachment = useCallback((id: string) => {
    const stamp = nodesRef.current.find(
      (node): node is StampNode => node.id === id && node.type === "stamp",
    );
    if (!stamp) return;

    const stickies = getStickyNodes(nodesRef.current);
    const center = {
      x: stamp.x + stamp.width / 2,
      y: stamp.y + stamp.height / 2,
    };
    const snapped = resolveStampPlacement(center, stickies, STAMP_SIZE);
    const x = snapped.x - stamp.width / 2;
    const y = snapped.y - stamp.height / 2;
    const attachedStickyId = findAttachedStickyId(
      { x, y, width: stamp.width, height: stamp.height },
      stickies,
    );

    setNodes((current) =>
      current.map((node) => {
        if (node.id !== id || node.type !== "stamp") return node;

        if (
          node.x === x &&
          node.y === y &&
          node.attachedStickyId === attachedStickyId
        ) {
          return node;
        }

        return { ...node, x, y, attachedStickyId };
      }),
    );
  }, []);

  const moveSection = useCallback((id: string, newX: number, newY: number) => {
    setNodes((current) => {
      const section = current.find(
        (node): node is Extract<CanvasNode, { type: "section" }> =>
          node.id === id && node.type === "section",
      );
      if (!section) return current;

      const dx = newX - section.x;
      const dy = newY - section.y;
      if (dx === 0 && dy === 0) return current;

      const movingStickyIds = new Set(
        current
          .filter(
            (node): node is StickyNode =>
              node.type === "sticky" && node.sectionId === id,
          )
          .map((node) => node.id),
      );

      return current.map((node) => {
        if (node.id === id) {
          return { ...node, x: newX, y: newY };
        }

        if (node.type === "sticky" && node.sectionId === id) {
          return { ...node, x: node.x + dx, y: node.y + dy };
        }

        if (
          node.type === "stamp" &&
          node.attachedStickyId &&
          movingStickyIds.has(node.attachedStickyId)
        ) {
          return { ...node, x: node.x + dx, y: node.y + dy };
        }

        if (node.type === "stamp" && !node.attachedStickyId) {
          const centerX = node.x + node.width / 2;
          const centerY = node.y + node.height / 2;
          const insideSection =
            centerX >= section.x &&
            centerX <= section.x + section.width &&
            centerY >= section.y &&
            centerY <= section.y + section.height;

          if (insideSection) {
            return { ...node, x: node.x + dx, y: node.y + dy };
          }
        }

        if (node.type === "embed") {
          const centerX = node.x + node.width / 2;
          const centerY = node.y + node.height / 2;
          const insideSection =
            centerX >= section.x &&
            centerX <= section.x + section.width &&
            centerY >= section.y &&
            centerY <= section.y + section.height;

          if (insideSection) {
            return { ...node, x: node.x + dx, y: node.y + dy };
          }
        }

        if (node.type === "image") {
          const centerX = node.x + node.width / 2;
          const centerY = node.y + node.height / 2;
          const insideSection =
            centerX >= section.x &&
            centerX <= section.x + section.width &&
            centerY >= section.y &&
            centerY <= section.y + section.height;

          if (insideSection) {
            return { ...node, x: node.x + dx, y: node.y + dy };
          }
        }

        if (node.type === "text") {
          const centerX = node.x + node.width / 2;
          const centerY = node.y + node.height / 2;
          const insideSection =
            centerX >= section.x &&
            centerX <= section.x + section.width &&
            centerY >= section.y &&
            centerY <= section.y + section.height;

          if (insideSection || node.sectionId === id) {
            return { ...node, x: node.x + dx, y: node.y + dy };
          }
        }

        return node;
      });
    });
  }, []);

  const deleteNode = useCallback((id: string) => {
    history.recordHistory();
    setNodes((current) =>
      current
        .filter((node) => node.id !== id)
        .map((node) => {
          if (node.type === "stamp" && node.attachedStickyId === id) {
            return { ...node, attachedStickyId: undefined };
          }
          return node;
        }),
    );
    setSelectedIds((current) => current.filter((entry) => entry !== id));
  }, [history]);

  const duplicateStamp = useCallback((id: string) => {
    const source = nodesRef.current.find(
      (n): n is StampNode => n.id === id && n.type === "stamp",
    );
    if (!source) return;

    history.recordHistory();
    const stamp = cloneStamp(
      source,
      source.x + STAMP_DUPLICATE_OFFSET,
      source.y + STAMP_DUPLICATE_OFFSET,
    );
    stamp.attachedStickyId = findAttachedStickyId(
      stampRect(stamp),
      getStickyNodes(nodesRef.current),
    );
    setNodes((current) => [...current, stamp]);
    setSelectedId(stamp.id);
  }, [history]);

  const duplicateText = useCallback((id: string) => {
    const source = nodesRef.current.find(
      (n): n is TextNode => n.id === id && n.type === "text",
    );
    if (!source) return;

    history.recordHistory();
    const textNode = cloneText(
      source,
      source.x + STICKY_GAP,
      source.y + STICKY_GAP,
    );
    setNodes((current) => [...current, textNode]);
    setSelectedId(textNode.id);
  }, [history]);

  const duplicateEmbed = useCallback((id: string) => {
    const source = nodesRef.current.find(
      (n): n is EmbedNode => n.id === id && n.type === "embed",
    );
    if (!source) return;

    history.recordHistory();
    const embed = cloneEmbed(
      source,
      source.x + STICKY_GAP,
      source.y + STICKY_GAP,
    );
    setNodes((current) => [...current, embed]);
    setSelectedId(embed.id);
  }, [history]);

  const deleteSelectedNode = useCallback(() => {
    if (selectedIds.length === 0) return false;

    const idsToDelete = selectedIds.filter((id) => {
      const node = nodesRef.current.find((entry) => entry.id === id);
      return node && node.type !== "section";
    });

    if (idsToDelete.length === 0) return false;

    history.recordHistory();
    const deleteSet = new Set(idsToDelete);
    setNodes((current) =>
      current
        .filter((node) => !deleteSet.has(node.id))
        .map((node) => {
          if (node.type === "stamp" && node.attachedStickyId && deleteSet.has(node.attachedStickyId)) {
            return { ...node, attachedStickyId: undefined };
          }
          return node;
        }),
    );
    setSelectedIds([]);
    return true;
  }, [history, selectedIds]);

  const copySelectedSticky = useCallback(() => {
    const selected = selectedId
      ? nodesRef.current.find(
          (n): n is StickyNode => n.id === selectedId && n.type === "sticky",
        )
      : null;
    if (!selected) return false;
    stickyClipboardRef.current = { ...selected };
    textClipboardRef.current = null;
    return true;
  }, [selectedId]);

  const copySelectedText = useCallback(() => {
    const selected = selectedId
      ? nodesRef.current.find(
          (n): n is TextNode => n.id === selectedId && n.type === "text",
        )
      : null;
    if (!selected) return false;
    textClipboardRef.current = { ...selected };
    stickyClipboardRef.current = null;
    return true;
  }, [selectedId]);

  const copySelectedNode = useCallback(() => {
    return copySelectedSticky() || copySelectedText();
  }, [copySelectedSticky, copySelectedText]);

  const pasteSticky = useCallback(() => {
    const source = stickyClipboardRef.current;
    if (!source) return false;

    history.recordHistory();
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
  }, [authorName, history]);

  const pasteText = useCallback(() => {
    const source = textClipboardRef.current;
    if (!source) return false;

    history.recordHistory();
    const sections = getSectionNodes(nodesRef.current);
    const snap = snapNodeToSection(
      source.x + STICKY_GAP,
      source.y + STICKY_GAP,
      source.width,
      source.height,
      sections,
    );
    const textNode = cloneText(source, snap.x, snap.y);
    textNode.sectionId = snap.sectionId;

    setNodes((current) => [...current, textNode]);
    setSelectedId(textNode.id);
    return true;
  }, [history]);

  const pasteClipboard = useCallback(() => {
    return pasteText() || pasteSticky();
  }, [pasteSticky, pasteText]);

  const canPasteClipboard = useCallback(() => {
    return Boolean(stickyClipboardRef.current || textClipboardRef.current);
  }, []);

  const pasteClipboardAt = useCallback(
    (worldX: number, worldY: number) => {
      const textSource = textClipboardRef.current;
      if (textSource) {
        history.recordHistory();
        const sections = getSectionNodes(nodesRef.current);
        const snap = snapNodeToSection(
          worldX - textSource.width / 2,
          worldY - textSource.height / 2,
          textSource.width,
          textSource.height,
          sections,
        );
        const textNode = cloneText(textSource, snap.x, snap.y);
        textNode.sectionId = snap.sectionId;
        setNodes((current) => [...current, textNode]);
        setSelectedId(textNode.id);
        return true;
      }

      const stickySource = stickyClipboardRef.current;
      if (stickySource) {
        history.recordHistory();
        const sections = getSectionNodes(nodesRef.current);
        const snap = snapStickyToSection(
          worldX - stickySource.width / 2,
          worldY - stickySource.height / 2,
          sections,
        );
        const sticky = cloneSticky(stickySource, snap.x, snap.y, authorName);
        sticky.sectionId = snap.sectionId;
        setNodes((current) => [...current, sticky]);
        setSelectedId(sticky.id);
        return true;
      }

      return false;
    },
    [authorName, history],
  );

  const setBackgroundColorWithHistory = useCallback(
    (color: string) => {
      if (color === backgroundColorRef.current) return;
      history.recordHistory();
      setBackgroundColor(color);
    },
    [history],
  );

  const updateEmbedNode = useCallback(
    (id: string, patch: Partial<EmbedNode>) => {
      const isGeometry = ["x", "y", "width", "height"].some((key) => key in patch);
      if (!isGeometry) {
        history.recordHistory();
      }
      updateNode(id, patch);
    },
    [history, updateNode],
  );

  const updateSectionTitle = useCallback(
    (id: string, title: string) => {
      history.recordHistory();
      updateNode(id, { title });
    },
    [history, updateNode],
  );

  return {
    nodes,
    backgroundColor,
    setBackgroundColor: setBackgroundColorWithHistory,
    placementTool,
    setPlacementTool,
    selectedId,
    selectedIds,
    setSelectedId,
    selectNode,
    selectNodes,
    clearSelection,
    recentDropIds,
    templatePickerOpen,
    setTemplatePickerOpen,
    applyTemplate,
    addStickyAt,
    addTextAt,
    addStampAt,
    addEmbedAt,
    addImageAt,
    dropImagesAt,
    startEmbedPlacement,
    addAdjacentSticky,
    updateStickyFormat,
    updateTextFormat,
    moveNode,
    moveSection,
    finalizeStampAttachment,
    updateNode,
    deleteNode,
    duplicateStamp,
    duplicateText,
    duplicateEmbed,
    deleteSelectedNode,
    copySelectedSticky,
    copySelectedText,
    copySelectedNode,
    pasteSticky,
    pasteText,
    pasteClipboard,
    canPasteClipboard,
    pasteClipboardAt,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    beginHistoryGesture: history.beginHistoryGesture,
    endHistoryGesture: history.endHistoryGesture,
    updateEmbedNode,
    updateSectionTitle,
  };
}
