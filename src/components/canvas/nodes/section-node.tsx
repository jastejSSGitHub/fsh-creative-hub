"use client";

import type { SectionNode } from "@/lib/canvas/types";

type SectionNodeViewProps = {
  node: SectionNode;
  onTitleChange: (title: string) => void;
};

export function SectionNodeView({ node, onTitleChange }: SectionNodeViewProps) {
  return (
    <div
      className="absolute overflow-hidden rounded-lg shadow-lg"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: node.fillColor,
        border: `2px solid ${node.accentColor}`,
      }}
    >
      <div
        className="px-4 py-3"
        style={{ backgroundColor: node.accentColor }}
      >
        <input
          type="text"
          value={node.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full bg-transparent font-display text-xl font-extrabold text-white outline-none placeholder:text-white/60"
          placeholder="How might we _________?"
        />
      </div>

      <span
        className="absolute left-3 top-[3.25rem] rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium text-white"
        style={{ backgroundColor: node.accentColor }}
      >
        {node.subtitle}
      </span>

      <div
        className="pointer-events-none absolute left-8 top-24 size-[200px] rounded-sm border-2 border-dashed opacity-40"
        style={{ borderColor: node.accentColor }}
        aria-hidden
      />
    </div>
  );
}
