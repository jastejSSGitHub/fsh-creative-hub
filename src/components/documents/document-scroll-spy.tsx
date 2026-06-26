"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type ScrollSpyHeading = {
  id: string;
  text: string;
  level: number;
};

type DocumentScrollSpyProps = {
  headings: ScrollSpyHeading[];
};

export function DocumentScrollSpy({ headings }: DocumentScrollSpyProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id.replace("block-", ""));
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    for (const heading of headings) {
      const el = document.getElementById(`block-${heading.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <aside
      aria-label="Document outline"
      className="pointer-events-none fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-1.5 xl:flex"
    >
      {headings.map((heading) => {
        const isActive = activeId === heading.id;
        const width =
          heading.level === 1 ? "2rem" : heading.level === 2 ? "1.5rem" : "1rem";

        return (
          <button
            key={heading.id}
            type="button"
            title={heading.text}
            onClick={() => {
              document.getElementById(`block-${heading.id}`)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className="pointer-events-auto group flex items-center gap-2"
          >
            <span
              className={cn(
                "max-w-[8rem] truncate text-[0.625rem] text-hub-foreground/0 transition-all group-hover:text-hub-foreground/55",
                isActive && "text-hub-foreground/70",
              )}
            >
              {heading.text}
            </span>
            <span
              className={cn(
                "block h-0.5 rounded-full bg-hub-foreground/20 transition-all",
                isActive && "bg-hub-primary",
              )}
              style={{ width }}
            />
          </button>
        );
      })}
    </aside>
  );
}
