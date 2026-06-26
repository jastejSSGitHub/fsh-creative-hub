"use client";

import { Bold, Link2, List, Strikethrough } from "lucide-react";

import { STICKY_COLORS } from "@/lib/canvas/presets";
import type { CanvasTextSize, StickyColorId } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

type StickyFormatToolbarProps = {
  color: StickyColorId;
  textSize: CanvasTextSize;
  bold: boolean;
  strikethrough: boolean;
  onChange: (patch: {
    color?: StickyColorId;
    textSize?: CanvasTextSize;
    bold?: boolean;
    strikethrough?: boolean;
  }) => void;
};

const SIZE_OPTIONS: CanvasTextSize[] = ["small", "medium", "large", "extra-large"];

export function StickyFormatToolbar({
  color,
  textSize,
  bold,
  strikethrough,
  onChange,
}: StickyFormatToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#1a1a1a] px-2 py-1.5 shadow-xl">
      <div className="relative">
        <button
          type="button"
          className="size-6 rounded-full border-2 border-white/20"
          style={{ backgroundColor: STICKY_COLORS[color].fill }}
          aria-label="Sticky color"
        />
        <select
          value={color}
          onChange={(e) => onChange({ color: e.target.value as StickyColorId })}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Change sticky color"
        >
          {Object.entries(STICKY_COLORS).map(([id, c]) => (
            <option key={id} value={id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <select
        value={textSize}
        onChange={(e) => onChange({ textSize: e.target.value as CanvasTextSize })}
        className="rounded-md bg-white/10 px-1.5 py-0.5 text-[0.6875rem] text-white outline-none"
        aria-label="Text size"
      >
        {SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size.replace("-", " ")}
          </option>
        ))}
      </select>

      <ToolbarToggle active={bold} label="Bold" onClick={() => onChange({ bold: !bold })}>
        <Bold className="size-3.5" />
      </ToolbarToggle>

      <ToolbarToggle
        active={strikethrough}
        label="Strikethrough"
        onClick={() => onChange({ strikethrough: !strikethrough })}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarToggle>

      <button
        type="button"
        className="inline-flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
        aria-label="Add link"
        title="Coming soon"
      >
        <Link2 className="size-3.5" />
      </button>

      <button
        type="button"
        className="inline-flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
        aria-label="Bullet list"
        title="Coming soon"
      >
        <List className="size-3.5" />
      </button>
    </div>
  );
}

function ToolbarToggle({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10",
        active && "bg-[#7c3aed] text-white",
      )}
    >
      {children}
    </button>
  );
}
