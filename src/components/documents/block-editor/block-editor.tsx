"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { BlockGutter } from "@/components/documents/block-editor/block-gutter";
import {
  HtmlEmbedBlock,
  WebEmbedBlock,
} from "@/components/documents/block-editor/embed-block";
import {
  SlashMenu,
  slashCommandToBlockType,
} from "@/components/documents/block-editor/slash-menu";
import type { SlashCommand } from "@/lib/documents/slash-commands";
import {
  embedHostLabel,
  extractUrlFromDataTransfer,
  normalizeEmbedUrl,
} from "@/lib/documents/embed-utils";
import {
  createBlock,
  type DocumentBlock,
  type DocumentBlockType,
} from "@/lib/documents/types";
import { textDocumentPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type LinkedPageOption = {
  id: string;
  name: string;
  icon?: string | null;
};

const TRAILING_ZONE_ID = "__trailing-zone__";

function isEmptyParagraph(block: DocumentBlock) {
  return block.type === "paragraph" && !block.content.trim();
}

function needsDedicatedTrailingZone(blocks: DocumentBlock[]) {
  const last = blocks[blocks.length - 1];
  if (!last) return true;
  return !isEmptyParagraph(last);
}

type BlockEditorProps = {
  blocks: DocumentBlock[];
  onChange: (blocks: DocumentBlock[]) => void;
  canEdit: boolean;
  projectId: string;
  linkedPages?: LinkedPageOption[];
  onHeadingsChange?: (headings: { id: string; text: string; level: number }[]) => void;
};

function blockPlaceholder(type: DocumentBlockType): string {
  if (type === "code") return "Write code…";
  if (type === "quote") return "Quote…";
  if (type === "pageLink") return "Select a page below";
  if (type === "image") return "Image caption (optional)";
  return "Press '/' for commands";
}

function blockClassName(type: DocumentBlockType): string {
  switch (type) {
    case "heading1":
      return "font-display text-[2rem] font-extrabold leading-tight tracking-tight";
    case "heading2":
      return "font-display text-[1.5rem] font-bold leading-snug tracking-tight";
    case "heading3":
      return "text-[1.25rem] font-semibold leading-snug";
    case "heading4":
      return "text-[1.0625rem] font-semibold leading-snug";
    case "quote":
      return "border-l-[3px] border-hub-foreground/20 pl-3 italic text-hub-foreground/75";
    case "code":
      return "font-mono text-[0.8125rem] leading-relaxed";
    case "bulletList":
      return "pl-6 before:absolute before:left-0 before:top-[0.55em] before:size-1.5 before:rounded-full before:bg-hub-foreground/45 before:content-['']";
    case "numberedList":
      return "pl-6";
    default:
      return "text-[0.9375rem] leading-relaxed";
  }
}

export function BlockEditor({
  blocks,
  onChange,
  canEdit,
  projectId,
  linkedPages = [],
  onHeadingsChange,
}: BlockEditorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [slashState, setSlashState] = useState<{
    blockId: string;
    query: string;
  } | null>(null);

  const inputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const updateBlock = useCallback(
    (id: string, patch: Partial<DocumentBlock>) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    [blocks, onChange],
  );

  const insertBlockAfter = useCallback(
    (afterId: string, type: DocumentBlockType = "paragraph") => {
      const index = blocks.findIndex((b) => b.id === afterId);
      if (index === -1) return;
      const next = [...blocks];
      const block = createBlock(type);
      next.splice(index + 1, 0, block);
      onChange(next);
      requestAnimationFrame(() => inputRefs.current.get(block.id)?.focus());
    },
    [blocks, onChange],
  );

  const insertWebEmbedAfter = useCallback(
    (afterId: string, url: string) => {
      const normalized = normalizeEmbedUrl(url);
      if (!normalized) return;

      const index = blocks.findIndex((b) => b.id === afterId);
      if (index === -1) return;

      const block = createBlock("webEmbed");
      block.content = embedHostLabel(normalized);
      block.meta = { ...block.meta, embedUrl: normalized, embedHeight: 560 };

      const next = [...blocks];
      next.splice(index + 1, 0, block);
      onChange(next);
    },
    [blocks, onChange],
  );

  const replaceBlockType = useCallback(
    (id: string, type: DocumentBlockType) => {
      onChange(
        blocks.map((b) =>
          b.id === id
            ? {
                ...createBlock(type),
                id: b.id,
                content: type === "divider" ? "" : b.content.replace(/^\//, ""),
              }
            : b,
        ),
      );
      requestAnimationFrame(() => inputRefs.current.get(id)?.focus());
    },
    [blocks, onChange],
  );

  const removeBlockIfEmpty = useCallback(
    (id: string) => {
      if (blocks.length <= 1) return;
      const block = blocks.find((b) => b.id === id);
      if (!block || block.content.trim()) return;
      onChange(blocks.filter((b) => b.id !== id));
    },
    [blocks, onChange],
  );

  const deleteBlock = useCallback(
    (id: string) => {
      if (blocks.length <= 1) return;
      const index = blocks.findIndex((b) => b.id === id);
      if (index === -1) return;

      const next = blocks.filter((b) => b.id !== id);
      onChange(next);

      const focusIndex = index > 0 ? index - 1 : 0;
      const focusId = next[focusIndex]?.id;
      if (focusId) {
        requestAnimationFrame(() => inputRefs.current.get(focusId)?.focus());
      }
    },
    [blocks, onChange],
  );

  const canDeleteBlock = blocks.length > 1;

  const focusBlock = useCallback((blockId: string) => {
    requestAnimationFrame(() => inputRefs.current.get(blockId)?.focus());
  }, []);

  const openSlashMenuBelow = useCallback(
    (afterId: string) => {
      const index = blocks.findIndex((b) => b.id === afterId);
      if (index === -1) return;

      const below = blocks[index + 1];
      if (below && isEmptyParagraph(below)) {
        onChange(
          blocks.map((block) =>
            block.id === below.id ? { ...block, content: "/" } : block,
          ),
        );
        setSlashState({ blockId: below.id, query: "" });
        focusBlock(below.id);
        return;
      }

      const block = createBlock("paragraph");
      block.content = "/";
      const next = [...blocks];
      next.splice(index + 1, 0, block);
      onChange(next);
      setSlashState({ blockId: block.id, query: "" });
      focusBlock(block.id);
    },
    [blocks, focusBlock, onChange],
  );

  const gutterProps = (blockId: string) => ({
    visible: hoveredId === blockId,
    canDelete: canDeleteBlock,
    onAddBelow: () => openSlashMenuBelow(blockId),
    onDelete: () => deleteBlock(blockId),
  });

  const addBlockAtEnd = useCallback(() => {
    const lastId = blocks[blocks.length - 1]?.id;
    if (!lastId) return;
    openSlashMenuBelow(lastId);
  }, [blocks, openSlashMenuBelow]);

  const handleTrailingZoneClick = useCallback(() => {
    const last = blocks[blocks.length - 1];
    if (!last) return;

    if (isEmptyParagraph(last)) {
      onChange(
        blocks.map((block) =>
          block.id === last.id ? { ...block, content: "/" } : block,
        ),
      );
      setSlashState({ blockId: last.id, query: "" });
      focusBlock(last.id);
      return;
    }

    openSlashMenuBelow(last.id);
  }, [blocks, focusBlock, onChange]);

  const blockRowClassName = (...extra: (string | false | null | undefined)[]) =>
    cn("group relative -ml-24 pl-24", ...extra);

  const renderBlockShell = (
    block: DocumentBlock,
    content: ReactNode,
    options?: {
      className?: string;
      dropTarget?: boolean;
      dataHeading?: boolean;
      extendHoverArea?: boolean;
      onShellClick?: (event: MouseEvent<HTMLDivElement>) => void;
    },
  ) => (
    <div
      key={block.id}
      id={`block-${block.id}`}
      data-heading={options?.dataHeading ? "true" : undefined}
      className={blockRowClassName(
        options?.className,
        options?.extendHoverArea && "min-h-[40vh] cursor-text",
        options?.dropTarget !== false &&
          dropTargetId === block.id &&
          "rounded-[4px] ring-2 ring-hub-primary/25",
      )}
      onMouseEnter={() => setHoveredId(block.id)}
      onMouseLeave={() => setHoveredId(null)}
      onClick={options?.onShellClick}
      onDragOver={(e) => handleBlockDragOver(e, block.id)}
      onDrop={(e) => handleBlockDrop(e, block.id)}
    >
      {canEdit ? (
        <BlockGutter
          {...gutterProps(block.id)}
          dragHandleProps={{
            draggable: true,
            onDragStart: () => setDraggingId(block.id),
            onDragEnd: () => {
              setDraggingId(null);
              setDropTargetId(null);
            },
          }}
        />
      ) : null}
      {content}
    </div>
  );

  const reorderBlocks = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      const fromIndex = blocks.findIndex((b) => b.id === fromId);
      const toIndex = blocks.findIndex((b) => b.id === toId);
      if (fromIndex === -1 || toIndex === -1) return;
      const next = [...blocks];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved!);
      onChange(next);
    },
    [blocks, onChange],
  );

  const handleBlockDragOver = useCallback(
    (event: DragEvent, blockId: string) => {
      event.preventDefault();
      const types = event.dataTransfer.types;
      if (types.includes("text/uri-list") || types.includes("text/plain")) {
        event.dataTransfer.dropEffect = "copy";
      }
      setDropTargetId(blockId);
    },
    [],
  );

  const handleBlockDrop = useCallback(
    (event: DragEvent, blockId: string) => {
      event.preventDefault();
      if (draggingId) {
        reorderBlocks(draggingId, blockId);
      } else if (canEdit) {
        const url = extractUrlFromDataTransfer(event.dataTransfer);
        if (url) insertWebEmbedAfter(blockId, url);
      }
      setDraggingId(null);
      setDropTargetId(null);
    },
    [canEdit, draggingId, insertWebEmbedAfter, reorderBlocks],
  );

  const embedBlockShell = (
    block: DocumentBlock,
    content: ReactNode,
    options?: {
      dropTarget?: boolean;
      extendHoverArea?: boolean;
      onShellClick?: (event: MouseEvent<HTMLDivElement>) => void;
    },
  ) =>
    renderBlockShell(block, content, {
      className: "py-2",
      dropTarget: options?.dropTarget,
      extendHoverArea: options?.extendHoverArea,
      onShellClick: options?.onShellClick,
    });

  useEffect(() => {
    const headings = blocks
      .filter((b) => b.type.startsWith("heading") && b.content.trim())
      .map((b) => ({
        id: b.id,
        text: b.content.trim(),
        level: Number(b.type.replace("heading", "")) || 1,
      }));
    onHeadingsChange?.(headings);
  }, [blocks, onHeadingsChange]);

  function handleSlashSelect(command: SlashCommand) {
    if (!slashState) return;
    const type = slashCommandToBlockType(command.id);

    if (type === "pageLink" && linkedPages[0]) {
      updateBlock(slashState.blockId, {
        type,
        content: "",
        meta: {
          linkedFileId: linkedPages[0].id,
          linkedFileName: linkedPages[0].name,
        },
      });
    } else if (type === "image") {
      const url = window.prompt("Image URL");
      if (url) {
        updateBlock(slashState.blockId, {
          type,
          content: "",
          meta: { imageUrl: url },
        });
      }
    } else {
      replaceBlockType(slashState.blockId, type);
    }

    setSlashState(null);
  }

  function handleSlashClose() {
    if (slashState) {
      const block = blocks.find((b) => b.id === slashState.blockId);
      if (block?.content.startsWith("/")) {
        updateBlock(slashState.blockId, { content: "" });
      }
    }
    setSlashState(null);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    block: DocumentBlock,
    index: number,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      insertBlockAfter(block.id);
      return;
    }

    if (event.key === "Backspace" && !block.content && blocks.length > 1) {
      event.preventDefault();
      const prev = blocks[index - 1];
      removeBlockIfEmpty(block.id);
      if (prev) requestAnimationFrame(() => inputRefs.current.get(prev.id)?.focus());
    }
  }

  function handleInput(block: DocumentBlock, value: string, el: HTMLTextAreaElement) {
    if (value.startsWith("/")) {
      setSlashState({
        blockId: block.id,
        query: value.slice(1),
      });
    } else if (slashState?.blockId === block.id) {
      setSlashState(null);
    }
    updateBlock(block.id, { content: value });
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  const getSlashAnchorElement = useCallback(() => {
    if (!slashState) return null;
    return inputRefs.current.get(slashState.blockId) ?? null;
  }, [slashState]);

  return (
    <div
      className="relative mx-auto min-h-[50vh] w-full pb-24 pl-24"
      onDragOver={(e) => {
        if (!canEdit || blocks.length === 0) return;
        const last = blocks[blocks.length - 1];
        if (last) handleBlockDragOver(e, last.id);
      }}
      onDrop={(e) => {
        if (!canEdit || blocks.length === 0) return;
        const last = blocks[blocks.length - 1];
        if (last) handleBlockDrop(e, last.id);
      }}
    >
      {blocks.map((block, index) => {
        const isLast = index === blocks.length - 1;
        const isLastEmptyParagraph = isLast && isEmptyParagraph(block);
        const shellOptions = {
          extendHoverArea: isLastEmptyParagraph,
          onShellClick: isLastEmptyParagraph && canEdit
            ? (event: MouseEvent<HTMLDivElement>) => {
                const target = event.target as HTMLElement;
                if (target.closest("textarea, button, a, input")) return;
                focusBlock(block.id);
              }
            : undefined,
        };

        const isHeading = block.type.startsWith("heading");
        const numbered =
          block.type === "numberedList"
            ? blocks
                .slice(0, index + 1)
                .filter((b) => b.type === "numberedList").length
            : 0;

        if (block.type === "divider") {
          return renderBlockShell(
            block,
            <hr
              className={cn(
                "border-hub-foreground/12",
                dropTargetId === block.id && "ring-2 ring-hub-primary/30",
              )}
            />,
            { className: "py-2", ...shellOptions },
          );
        }

        if (block.type === "pageLink" && block.meta?.linkedFileId) {
          return renderBlockShell(
            block,
            <Link
              href={textDocumentPath(projectId, block.meta.linkedFileId)}
              className="flex items-center gap-2 rounded-[6px] border border-hub-foreground/10 bg-hub-foreground/[0.03] px-3 py-2.5 transition-colors hover:bg-hub-foreground/[0.06]"
            >
              <span className="text-lg">📄</span>
              <span className="text-[0.875rem] font-medium text-hub-foreground">
                {block.meta.linkedFileName ?? "Linked page"}
              </span>
            </Link>,
            { className: "py-1", dropTarget: false, ...shellOptions },
          );
        }

        if (block.type === "image" && block.meta?.imageUrl) {
          return renderBlockShell(
            block,
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.meta.imageUrl}
                alt={block.content || "Embedded image"}
                className="max-h-[24rem] w-full rounded-[6px] object-cover"
              />
              {block.content ? (
                <p className="mt-1.5 text-center text-[0.75rem] text-hub-foreground/50">
                  {block.content}
                </p>
              ) : null}
            </>,
            { className: "py-2", dropTarget: false, ...shellOptions },
          );
        }

        if (block.type === "webEmbed") {
          return embedBlockShell(
            block,
            <WebEmbedBlock
              block={block}
              canEdit={canEdit}
              onUpdate={(patch) => updateBlock(block.id, patch)}
              onDelete={canDeleteBlock ? () => deleteBlock(block.id) : undefined}
            />,
            shellOptions,
          );
        }

        if (block.type === "htmlEmbed") {
          return embedBlockShell(
            block,
            <HtmlEmbedBlock
              block={block}
              canEdit={canEdit}
              onUpdate={(patch) => updateBlock(block.id, patch)}
              onDelete={canDeleteBlock ? () => deleteBlock(block.id) : undefined}
            />,
            shellOptions,
          );
        }

        if (block.type === "table") {
          const rows = block.meta?.tableRows ?? [["", ""]];
          return renderBlockShell(
            block,
            <div className="overflow-x-auto rounded-[6px] border border-hub-foreground/12">
              <table className="w-full min-w-[20rem] border-collapse text-[0.8125rem]">
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-hub-foreground/8 last:border-0">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border-r border-hub-foreground/8 p-2 last:border-0">
                          {canEdit ? (
                            <input
                              value={cell}
                              onChange={(e) => {
                                const nextRows = rows.map((r, ri) =>
                                  ri === rowIndex
                                    ? r.map((c, ci) => (ci === cellIndex ? e.target.value : c))
                                    : r,
                                );
                                updateBlock(block.id, {
                                  meta: { ...block.meta, tableRows: nextRows },
                                });
                              }}
                              className="w-full bg-transparent outline-none"
                            />
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>,
            { className: "py-2", dropTarget: false, ...shellOptions },
          );
        }

        if (block.type === "code") {
          return renderBlockShell(
            block,
            <pre className="overflow-x-auto rounded-[6px] bg-hub-foreground/[0.06] p-3">
              <textarea
                ref={(el) => {
                  if (el) inputRefs.current.set(block.id, el);
                }}
                value={block.content}
                readOnly={!canEdit}
                placeholder={blockPlaceholder(block.type)}
                rows={3}
                onChange={(e) => handleInput(block, e.target.value, e.target)}
                onKeyDown={(e) => handleKeyDown(e, block, index)}
                className={cn(
                  "w-full resize-none bg-transparent outline-none",
                  blockClassName(block.type),
                )}
              />
            </pre>,
            { className: "py-1", dropTarget: false, ...shellOptions },
          );
        }

        return renderBlockShell(
          block,
          <>
            {block.type === "numberedList" ? (
              <span className="absolute left-24 top-[0.35rem] w-6 text-right text-[0.8125rem] text-hub-foreground/45">
                {numbered}.
              </span>
            ) : null}

            <textarea
              ref={(el) => {
                if (el) {
                  inputRefs.current.set(block.id, el);
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }
              }}
              value={block.content}
              readOnly={!canEdit}
              placeholder={blockPlaceholder(block.type)}
              rows={1}
              onChange={(e) => handleInput(block, e.target.value, e.target)}
              onKeyDown={(e) => handleKeyDown(e, block, index)}
              className={cn(
                "relative w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-hub-foreground/35",
                blockClassName(block.type),
                block.type === "bulletList" && "relative",
              )}
            />
          </>,
          { className: "py-0.5", dataHeading: isHeading, ...shellOptions },
        );
      })}

      {canEdit && needsDedicatedTrailingZone(blocks) ? (
        <div
          key={TRAILING_ZONE_ID}
          className={blockRowClassName("min-h-[40vh] cursor-text")}
          onMouseEnter={() => setHoveredId(TRAILING_ZONE_ID)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest("button")) return;
            handleTrailingZoneClick();
          }}
        >
          <BlockGutter
            visible={hoveredId === TRAILING_ZONE_ID}
            showDrag={false}
            canDelete={false}
            onAddBelow={addBlockAtEnd}
          />
          <p className="py-0.5 text-[0.9375rem] leading-relaxed text-hub-foreground/35">
            {blockPlaceholder("paragraph")}
          </p>
        </div>
      ) : null}

      <SlashMenu
        open={Boolean(slashState)}
        query={slashState?.query ?? ""}
        getAnchorElement={getSlashAnchorElement}
        onSelect={handleSlashSelect}
        onClose={handleSlashClose}
      />
    </div>
  );
}
