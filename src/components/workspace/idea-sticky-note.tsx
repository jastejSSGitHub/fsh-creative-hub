"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { StickyFormatToolbar } from "@/components/canvas/sticky-format-toolbar";
import { CanvasResizeHandles } from "@/components/canvas/nodes/canvas-resize-handles";
import {
  STICKY_COLORS,
  STICKY_HEIGHT,
  STICKY_MAX_HEIGHT,
  STICKY_MIN_HEIGHT,
  STICKY_MIN_WIDTH,
  STICKY_WIDTH,
} from "@/lib/canvas/presets";
import {
  measureStickyTextHeight,
  stickyTextWouldOverflow,
} from "@/lib/canvas/sticky-auto-size";
import type { CanvasTextSize, StickyColorId } from "@/lib/canvas/types";
import {
  normalizeIdeaTextSize,
  resolveIdeaStickyColor,
} from "@/lib/workspace/idea-sticky-colors";
import type { IdeaWithMeta } from "@/lib/workspace/queries";
import { cn } from "@/lib/utils";

const TEXT_SIZE_CLASS: Record<CanvasTextSize, string> = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
  "extra-large": "text-xl",
};

const TOOLBAR_Z = 9999;

type IdeaStickyNoteProps = {
  idea: IdeaWithMeta;
  width: number;
  height: number;
  maxWidth: number;
  selected: boolean;
  canMutate: boolean;
  isPending: boolean;
  onSelect: () => void;
  onResize: (size: { width: number; height: number }) => void;
  onResizeEnd: (size: { width: number; height: number }) => void;
  onBodyChange: (body: string) => void;
  onFormatChange: (patch: {
    color?: StickyColorId;
    textSize?: CanvasTextSize;
    bold?: boolean;
    strikethrough?: boolean;
  }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVote: () => void;
};

export function IdeaStickyNote({
  idea,
  width,
  height,
  maxWidth,
  selected,
  canMutate,
  isPending,
  onSelect,
  onResize,
  onResizeEnd,
  onBodyChange,
  onFormatChange,
  onDuplicate,
  onDelete,
  onToggleVote,
}: IdeaStickyNoteProps) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftRef = useRef(idea.body);
  const limitFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(idea.body);
  const [limitFlash, setLimitFlash] = useState(false);
  const [toolbarCoords, setToolbarCoords] = useState({ top: 0, left: 0 });
  const latestSizeRef = useRef({ width, height });

  const stickyColor = resolveIdeaStickyColor(idea.color);
  const textSize = normalizeIdeaTextSize(idea.text_size);
  const bold = idea.bold ?? false;
  const strikethrough = idea.strikethrough ?? false;
  const fill = STICKY_COLORS[stickyColor].fill;
  const boundsMaxWidth = Math.max(STICKY_MIN_WIDTH, Math.min(maxWidth, STICKY_WIDTH * 2));
  const showToolbar = selected && canMutate && !isEditing && !isResizing && !isPending;

  latestSizeRef.current = { width, height };
  draftRef.current = draft;

  const updateToolbarPosition = useCallback(() => {
    const el = stickyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setToolbarCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

  useEffect(() => {
    if (!showToolbar) return;

    updateToolbarPosition();
    window.addEventListener("scroll", updateToolbarPosition, true);
    window.addEventListener("resize", updateToolbarPosition);

    return () => {
      window.removeEventListener("scroll", updateToolbarPosition, true);
      window.removeEventListener("resize", updateToolbarPosition);
    };
  }, [showToolbar, width, height, updateToolbarPosition]);

  useEffect(() => {
    if (!isEditing) {
      setDraft(idea.body);
    }
  }, [idea.body, isEditing]);

  const triggerLimitFlash = useCallback(() => {
    setLimitFlash(true);
    if (limitFlashTimerRef.current) clearTimeout(limitFlashTimerRef.current);
    limitFlashTimerRef.current = setTimeout(() => setLimitFlash(false), 450);
  }, []);

  const syncHeightFromContent = useCallback(() => {
    if (isResizing || !isEditing) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const nextHeight = measureStickyTextHeight(textarea);
    if (nextHeight > height) {
      onResize({ width, height: nextHeight });
    }
  }, [height, isEditing, isResizing, onResize, width]);

  useLayoutEffect(() => {
    syncHeightFromContent();
  }, [draft, width, textSize, bold, strikethrough, syncHeightFromContent]);

  const commitEdit = useCallback(() => {
    const trimmed = draftRef.current.trim();
    setIsEditing(false);

    if (!trimmed) {
      setDraft(idea.body);
      return;
    }

    if (trimmed !== idea.body) {
      onBodyChange(trimmed);
    }
  }, [idea.body, onBodyChange]);

  const beginEdit = useCallback(() => {
    if (!canMutate || isPending) return;
    setIsEditing(true);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  }, [canMutate, isPending]);

  function handleTextChange(nextText: string) {
    const textarea = textareaRef.current;

    if (
      textarea &&
      nextText.length > draft.length &&
      stickyTextWouldOverflow(textarea, nextText)
    ) {
      triggerLimitFlash();
      return;
    }

    setDraft(nextText);
  }

  function insertEmojiAtCursor(emoji: string) {
    const textarea = textareaRef.current;
    const text = draft;

    if (!textarea) {
      onBodyChange(text + emoji);
      return;
    }

    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);

    if (stickyTextWouldOverflow(textarea, next)) {
      triggerLimitFlash();
      return;
    }

    setDraft(next);
    onBodyChange(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-canvas-resize]")) return;
    if ((event.target as HTMLElement).closest("[data-idea-vote]")) return;
    if ((event.target as HTMLElement).closest("[data-sticky-toolbar]")) return;
    event.stopPropagation();
    onSelect();
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-idea-vote]")) return;
    if (!canMutate) return;
    event.stopPropagation();
    beginEdit();
  }

  const textClassName = cn(
    "size-full resize-none overflow-hidden bg-transparent p-3 pb-10 outline-none placeholder:text-black/35",
    TEXT_SIZE_CLASS[textSize],
    bold && "font-bold",
    strikethrough && "line-through",
    isResizing && "pointer-events-none",
  );

  return (
    <>
      {showToolbar &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-sticky-toolbar
            className="pointer-events-auto fixed -translate-x-1/2 -translate-y-full pb-2"
            style={{
              top: toolbarCoords.top,
              left: toolbarCoords.left,
              zIndex: TOOLBAR_Z,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <StickyFormatToolbar
              color={stickyColor}
              textSize={textSize}
              bold={bold}
              strikethrough={strikethrough}
              onChange={onFormatChange}
              onInsertEmoji={insertEmojiAtCursor}
              showLinkEmbed={false}
              onCopy={onDuplicate}
              canDelete
              onDelete={onDelete}
            />
          </div>,
          document.body,
        )}

      <div
        ref={stickyRef}
        role="article"
        aria-label={`Idea: ${idea.body}`}
        className={cn(
          "relative touch-none overflow-visible rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-shadow",
          selected &&
            (limitFlash
              ? "ring-2 ring-red-500"
              : canMutate
                ? "ring-2 ring-[#18a0fb]"
                : "ring-2 ring-black/15"),
          isResizing ? "cursor-default select-none" : isEditing ? "cursor-text" : "cursor-pointer",
        )}
        style={{
          width,
          height,
          backgroundColor: fill,
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="absolute inset-0 overflow-hidden rounded-sm">
          {isEditing && canMutate ? (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => handleTextChange(event.target.value)}
              onBlur={commitEdit}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDraft(idea.body);
                  setIsEditing(false);
                }
              }}
              readOnly={isResizing}
              className={textClassName}
            />
          ) : (
            <p className={cn(textClassName, "overflow-auto")}>{idea.body}</p>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 pt-0">
            <span className="min-w-0 truncate text-[0.6875rem] text-black/45">
              {idea.author.display_name}
            </span>
            <button
              type="button"
              data-idea-vote
              disabled={isPending}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onToggleVote();
              }}
              className={cn(
                "pointer-events-auto inline-flex min-h-8 min-w-[2.75rem] shrink-0 items-center justify-center gap-0.5 rounded-md border px-2 text-[0.6875rem] font-semibold transition-all",
                idea.user_voted
                  ? "border-black/20 bg-black/85 text-white shadow-sm"
                  : "border-black/10 bg-white/70 text-black/80 hover:border-black/20 hover:bg-white",
              )}
              aria-pressed={idea.user_voted}
            >
              <span aria-hidden>▲</span>
              {idea.vote_count}
            </button>
          </div>
        </div>

        {selected && canMutate && !isPending && !isEditing ? (
          <div data-canvas-resize className="pointer-events-none absolute inset-0">
            <CanvasResizeHandles
              screenScale={1}
              bounds={{
                minWidth: STICKY_MIN_WIDTH,
                minHeight: STICKY_MIN_HEIGHT,
                maxWidth: boundsMaxWidth,
                maxHeight: STICKY_MAX_HEIGHT,
              }}
              rect={{ x: 0, y: 0, width, height }}
              onResizeStart={() => setIsResizing(true)}
              onResizeEnd={() => {
                setIsResizing(false);
                onResizeEnd(latestSizeRef.current);
              }}
              onBoundsHit={(hits) => {
                if (
                  hits.some(
                    (hit) =>
                      hit === "maxWidth" ||
                      hit === "maxHeight" ||
                      hit === "minWidth" ||
                      hit === "minHeight",
                  )
                ) {
                  triggerLimitFlash();
                }
              }}
              onResize={(rect) => {
                const next = {
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                };
                latestSizeRef.current = next;
                onResize(next);
              }}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

export function defaultIdeaStickySize(idea: Pick<IdeaWithMeta, "width" | "height">) {
  return {
    width: idea.width ?? STICKY_WIDTH,
    height: idea.height ?? STICKY_HEIGHT,
  };
}
