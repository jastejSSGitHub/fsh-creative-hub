"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  filterSlashCommands,
  type SlashCommand,
  slashCommandToBlockType,
} from "@/lib/documents/slash-commands";
import { cn } from "@/lib/utils";

type SlashMenuProps = {
  open: boolean;
  query: string;
  getAnchorElement: () => HTMLElement | null;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
};

export function SlashMenu({
  open,
  query,
  getAnchorElement,
  onSelect,
  onClose,
}: SlashMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewTop, setPreviewTop] = useState(0);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const commands = filterSlashCommands(query);

  const updateAnchorPosition = useCallback(() => {
    const anchor = getAnchorElement();
    setAnchorRect(anchor ? anchor.getBoundingClientRect() : null);
  }, [getAnchorElement]);

  const syncPreviewPosition = useCallback(() => {
    const list = listRef.current;
    const activeButton = optionRefs.current.get(activeIndex);
    if (!list || !activeButton) return;
    setPreviewTop(activeButton.offsetTop - list.scrollTop);
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useLayoutEffect(() => {
    if (!open) {
      setAnchorRect(null);
      return;
    }
    updateAnchorPosition();
  }, [open, query, updateAnchorPosition]);

  useEffect(() => {
    if (!open) return;

    function handlePositionChange() {
      updateAnchorPosition();
    }

    window.addEventListener("scroll", handlePositionChange, true);
    window.addEventListener("resize", handlePositionChange);

    const anchor = getAnchorElement();
    const resizeObserver =
      anchor && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handlePositionChange)
        : null;
    if (anchor && resizeObserver) resizeObserver.observe(anchor);

    return () => {
      window.removeEventListener("scroll", handlePositionChange, true);
      window.removeEventListener("resize", handlePositionChange);
      resizeObserver?.disconnect();
    };
  }, [open, getAnchorElement, updateAnchorPosition]);

  useEffect(() => {
    if (!open) return;
    syncPreviewPosition();
  }, [open, activeIndex, commands.length, syncPreviewPosition, anchorRect]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !open) return;

    function handleScroll() {
      syncPreviewPosition();
    }

    list.addEventListener("scroll", handleScroll, { passive: true });
    return () => list.removeEventListener("scroll", handleScroll);
  }, [open, syncPreviewPosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const activeButton = optionRefs.current.get(activeIndex);
    activeButton?.scrollIntoView({ block: "nearest" });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, commands.length - 1));
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }

      if (event.key === "Enter" && commands[activeIndex]) {
        event.preventDefault();
        onSelect(commands[activeIndex]!);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, commands, activeIndex, onSelect, onClose]);

  if (!open || !anchorRect || !commands.length) return null;

  const active = commands[activeIndex];

  return (
    <div
      ref={menuRef}
      className="fixed z-[120] flex items-start gap-2"
      style={{
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
      }}
    >
      <div
        ref={listRef}
        role="listbox"
        className="hub-subtle-scrollbar max-h-[min(22rem,50vh)] w-[17.5rem] shrink-0 overflow-y-auto rounded-[8px] border border-hub-foreground/12 bg-hub-espresso py-1 shadow-2xl"
      >
        {query.trim() ? (
          <p className="px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-wider text-hub-paper/45">
            Filtered results
          </p>
        ) : null}

        {commands.map((cmd, index) => (
          <button
            key={cmd.id}
            ref={(el) => {
              if (el) optionRefs.current.set(index, el);
              else optionRefs.current.delete(index);
            }}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => onSelect(cmd)}
            className={cn(
              "flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors",
              index === activeIndex ? "bg-white/10" : "hover:bg-white/5",
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[4px] bg-white/8 text-[0.65rem] font-bold text-hub-paper/70">
              {cmd.shortcut?.slice(0, 3) ?? cmd.label.slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] text-hub-paper">{cmd.label}</span>
              <span className="block truncate text-[0.6875rem] text-hub-paper/45">
                {cmd.description}
              </span>
            </span>
            {cmd.shortcut ? (
              <span className="shrink-0 font-mono text-[0.625rem] text-hub-paper/35">
                {cmd.shortcut}
              </span>
            ) : null}
          </button>
        ))}

        <div className="mx-2.5 my-1 border-t border-white/10" />
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-between px-3 py-1.5 text-[0.75rem] text-hub-paper/55 hover:bg-white/5"
        >
          Close menu
          <span className="font-mono text-[0.625rem]">esc</span>
        </button>
      </div>

      {active ? (
        <div
          className="pointer-events-none hidden w-[11rem] shrink-0 lg:block"
          style={{ marginTop: previewTop }}
        >
          <div className="rounded-[6px] bg-white px-3 py-2.5 text-hub-espresso shadow-lg">
            <p className="text-[0.8125rem] font-semibold">
              {active.label === "Heading 2" ? "Our Values" : active.label}
            </p>
            {active.group === "lists" ? (
              <ul className="mt-1 list-disc pl-4 text-[0.6875rem] text-hub-foreground/70">
                <li>Item one</li>
                <li>Item two</li>
              </ul>
            ) : (
              <p className="mt-1 text-[0.6875rem] text-hub-foreground/60">
                {active.description}
              </p>
            )}
          </div>
          <p className="mt-1.5 text-[0.6875rem] text-hub-foreground/55">{active.description}</p>
        </div>
      ) : null}
    </div>
  );
}

export { slashCommandToBlockType };
