"use client";

import { ExternalLink, Globe, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EmbedEmptyState } from "@/components/canvas/nodes/embed-empty-state";
import { EmbedActionToolbar } from "@/components/canvas/embed-action-toolbar";
import { CanvasResizeHandles } from "@/components/canvas/nodes/canvas-resize-handles";
import { CANVAS_Z } from "@/lib/canvas/node-layers";
import {
  EMBED_HEADER_HEIGHT,
  EMBED_MAX_HEIGHT,
  EMBED_MAX_WIDTH,
  EMBED_MIN_HEIGHT,
  EMBED_MIN_WIDTH,
} from "@/lib/canvas/presets";
import {
  embedHostLabel,
  isHtmlMarkup,
  normalizeEmbedUrl,
  resolveUrlOnlyEmbed,
  wrapHtmlDocument,
} from "@/lib/documents/embed-utils";
import type { EmbedNode } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

type EmbedNodeViewProps = {
  node: EmbedNode;
  selected: boolean;
  showToolbar?: boolean;
  screenScale: number;
  interactionDisabled?: boolean;
  onSelect: (options?: { additive?: boolean }) => void;
  onUpdate: (patch: Partial<EmbedNode>) => void;
  onDrag: (x: number, y: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onHistoryGestureStart?: () => void;
  onHistoryGestureEnd?: () => void;
};

export function EmbedNodeView({
  node,
  selected,
  showToolbar = selected,
  screenScale,
  interactionDisabled = false,
  onSelect,
  onUpdate,
  onDrag,
  onDuplicate,
  onDelete,
  onHistoryGestureStart,
  onHistoryGestureEnd,
}: EmbedNodeViewProps) {
  const embedUrl = node.embedUrl?.trim() ?? "";
  const embedHtml = node.embedHtml?.trim() ?? "";
  const hasContent = Boolean(embedUrl || embedHtml);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null>(null);

  const resizing = selected && isResizing;
  const dragging = selected && isDragging;

  useEffect(() => {
    if (!selected || hasContent) return;

    function handlePaste(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const text = event.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;

      const url = resolveUrlOnlyEmbed(text);
      if (url) {
        onUpdate({
          embedUrl: url,
          embedHtml: undefined,
          label: embedHostLabel(url),
        });
        event.preventDefault();
        return;
      }

      if (isHtmlMarkup(text)) {
        onUpdate({
          embedHtml: text,
          embedUrl: undefined,
          label: "HTML embed",
        });
        event.preventDefault();
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selected, hasContent, onUpdate]);

  function applyEmbedContent(raw: string) {
    const url = resolveUrlOnlyEmbed(raw);
    if (url) {
      onUpdate({
        embedUrl: url,
        embedHtml: undefined,
        label: embedHostLabel(url),
      });
      setEditing(false);
      return;
    }

    if (isHtmlMarkup(raw)) {
      onUpdate({
        embedHtml: raw,
        embedUrl: undefined,
        label: "HTML embed",
      });
      setEditing(false);
    }
  }

  function handleSaveDraft() {
    applyEmbedContent(draft);
  }

  const label = node.label || (embedUrl ? embedHostLabel(embedUrl) : "Link embed");
  const dragZoneHeight = Math.max(node.height * 0.1, EMBED_HEADER_HEIGHT);
  const contentHeight = Math.max(node.height - dragZoneHeight, 0);

  function handleSelect(event: React.PointerEvent) {
    if (isResizing) return;
    if ((event.target as HTMLElement).closest("[data-embed-toolbar]")) return;
    if ((event.target as HTMLElement).closest("[data-embed-interactive]")) return;
    if ((event.target as HTMLElement).closest("[data-canvas-resize]")) return;
    if ((event.target as HTMLElement).closest("[data-embed-drag]")) return;

    event.stopPropagation();
    onSelect({ additive: event.shiftKey });
  }

  function handleDragPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isResizing) return;
    if (hasContent && (event.target as HTMLElement).closest("[data-embed-interactive]")) return;
    if ((event.target as HTMLElement).closest("[data-canvas-resize]")) return;

    event.stopPropagation();
    onSelect({ additive: event.shiftKey });
    onHistoryGestureStart?.();
    if (hasContent) {
      setIsDragging(true);
    }
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      nodeX: node.x,
      nodeY: node.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (isResizing || !dragRef.current) return;

    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;

    if (!dragRef.current.moved && Math.hypot(dx, dy) >= 5) {
      dragRef.current.moved = true;
      setIsDragging(true);
    }

    if (!dragRef.current.moved) return;

    onDrag(
      dragRef.current.nodeX + dx / screenScale,
      dragRef.current.nodeY + dy / screenScale,
    );
  }

  function handleDragPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);
    onHistoryGestureEnd?.();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!hasContent && drag && !drag.moved && !isResizing) {
      setDraft("");
      setEditing(true);
    }
  }

  return (
    <>
      {showToolbar && !isDragging && !isResizing && !editing && !interactionDisabled ? (
        <div
          className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-full pb-2"
          style={{ left: node.x + node.width / 2, top: node.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <EmbedActionToolbar onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      ) : null}

    <div
      ref={rootRef}
      data-canvas-node
      data-canvas-embed={node.id}
      className={cn(
        "absolute touch-none overflow-visible rounded-[8px] border bg-white shadow-[0_8px_28px_rgba(0,0,0,0.14)]",
        selected ? "border-[#18a0fb] ring-2 ring-[#18a0fb]/40" : "border-black/10",
        !hasContent && selected && "canvas-embed-empty-pulse",
        (resizing || dragging) && "select-none",
        interactionDisabled && "pointer-events-none",
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: CANVAS_Z.embed,
      }}
      onPointerDown={(event) => {
        if (!hasContent) {
          handleDragPointerDown(event);
          return;
        }
        handleSelect(event);
      }}
      onPointerMove={!hasContent ? handleDragPointerMove : undefined}
      onPointerUp={!hasContent ? handleDragPointerUp : undefined}
      onPointerCancel={!hasContent ? handleDragPointerUp : undefined}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[7px]">
      {hasContent ? (
        <>
          <div
            data-embed-drag
            className={cn(
              "canvas-embed-drag-zone group/drag absolute inset-x-0 top-0 z-10 flex items-start gap-2 overflow-hidden rounded-t-[7px] border-b border-black/8 bg-black/[0.02] px-2.5 py-1.5",
              isDragging ? "cursor-grabbing" : "cursor-grab",
            )}
            style={{ height: dragZoneHeight }}
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerUp}
          >
            {!isDragging ? (
              <div
                className="canvas-embed-drag-stroke pointer-events-none absolute inset-[4px] rounded-t-[4px] border-2 border-dashed border-[#18a0fb]/50 opacity-0"
                aria-hidden
              />
            ) : null}
            <Globe className="relative z-[1] size-3.5 shrink-0 text-black/40" aria-hidden />
            <div className="relative z-[1] min-w-0 flex-1">
              <p className="truncate text-[0.75rem] font-medium text-black/80">{label}</p>
              {embedUrl ? (
                <p className="truncate text-[0.625rem] text-black/40">{embedUrl}</p>
              ) : null}
            </div>
            <div data-embed-interactive className="relative z-[1] flex shrink-0 items-center gap-0.5">
              {embedUrl ? (
                <button
                  type="button"
                  aria-label="Open in new tab"
                  onClick={() =>
                    window.open(embedUrl, "_blank", "noopener,noreferrer")
                  }
                  className="inline-flex size-6 items-center justify-center rounded-[4px] text-black/45 hover:bg-black/[0.06]"
                >
                  <ExternalLink className="size-3" />
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Edit link"
                onClick={() => {
                  setDraft(embedUrl || embedHtml);
                  setEditing(true);
                }}
                className="inline-flex size-6 items-center justify-center rounded-[4px] text-black/45 hover:bg-black/[0.06]"
              >
                <Pencil className="size-3" />
              </button>
            </div>
          </div>
          <div
            className={cn(
              "relative overflow-hidden rounded-b-[7px] bg-black/[0.02]",
              resizing && "pointer-events-none",
            )}
            style={{ height: contentHeight }}
          >
            {!selected ? (
              <div
                className="absolute inset-0 z-[5] cursor-pointer"
                onPointerDown={handleSelect}
                aria-hidden
              />
            ) : null}
            {embedUrl ? (
              <>
                <iframe
                  src={embedUrl}
                  title={label}
                  className="size-full border-0"
                  referrerPolicy="origin-when-cross-origin"
                  allowFullScreen
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent px-2 pb-1.5 pt-6">
                  <p className="pointer-events-auto text-[0.625rem] text-black/45">
                    Page blocked?{" "}
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#18a0fb] hover:underline"
                    >
                      Open link
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <iframe
                srcDoc={wrapHtmlDocument(embedHtml)}
                title="Embedded HTML"
                className="size-full border-0"
                sandbox="allow-scripts"
              />
            )}
          </div>
        </>
      ) : (
        <div
          className={cn(
            "relative size-full outline-none",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <EmbedEmptyState />
          {selected && (
            <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[0.625rem] font-medium text-[#18a0fb]">
              Click or paste a URL
            </p>
          )}
        </div>
      )}

      {editing && (
        <div
          data-embed-interactive
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="w-full max-w-sm rounded-[8px] border border-black/10 bg-white p-3 shadow-xl">
            <p className="text-[0.8125rem] font-medium text-black/85">Add a link</p>
            <p className="mt-0.5 text-[0.6875rem] text-black/45">
              Paste a URL or HTML — same as document embeds
            </p>
            <input
              type="url"
              autoFocus
              value={draft}
              placeholder="https://design.fshworld.com"
              className="mt-3 w-full rounded-[6px] border border-black/12 px-3 py-2 text-[0.8125rem] outline-none ring-[#18a0fb]/40 focus:border-[#18a0fb]/50 focus:ring-1"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSaveDraft();
                if (event.key === "Escape") setEditing(false);
              }}
              onPaste={(event) => {
                const text = event.clipboardData.getData("text/plain").trim();
                if (text) {
                  event.preventDefault();
                  applyEmbedContent(text);
                }
              }}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-[6px] px-2.5 py-1.5 text-[0.8125rem] text-black/55 hover:bg-black/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={!normalizeEmbedUrl(draft) && !isHtmlMarkup(draft)}
                className="rounded-[6px] bg-[#18a0fb] px-2.5 py-1.5 text-[0.8125rem] font-medium text-white hover:bg-[#1590e8] disabled:opacity-45"
              >
                Embed
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {selected && !editing ? (
        <div data-canvas-resize className="pointer-events-none absolute inset-0">
          <CanvasResizeHandles
            screenScale={screenScale}
            bounds={{
              minWidth: EMBED_MIN_WIDTH,
              minHeight: EMBED_MIN_HEIGHT,
              maxWidth: EMBED_MAX_WIDTH,
              maxHeight: EMBED_MAX_HEIGHT,
            }}
            rect={{
              x: node.x,
              y: node.y,
              width: node.width,
              height: node.height,
            }}
            onResizeStart={() => {
              onHistoryGestureStart?.();
              setIsResizing(true);
            }}
            onResizeEnd={() => {
              setIsResizing(false);
              onHistoryGestureEnd?.();
            }}
            onResize={(rect) =>
              onUpdate({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              })
            }
          />
        </div>
      ) : null}

      {resizing ? (
        <div className="pointer-events-none absolute -bottom-7 left-1/2 z-40 -translate-x-1/2 rounded-[4px] bg-[#18a0fb] px-2 py-0.5 text-[0.625rem] font-medium tabular-nums text-white shadow-md">
          {Math.round(node.width)} × {Math.round(node.height)}
        </div>
      ) : null}

    </div>
    </>
  );
}
