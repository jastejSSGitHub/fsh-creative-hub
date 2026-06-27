"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  TEMPLATE_THUMBNAIL_ILLUSTRATIONS,
} from "@/components/project-files/project-template-thumbnail-illustrations";
import type { ProjectTemplateId } from "@/lib/project-files/project-templates";
import { cn } from "@/lib/utils";

type TemplateCategory = "brainstorm" | "reviews";

type ProjectTemplatesBannerProps = {
  projectId: string;
  onUseTemplate?: (templateId: ProjectTemplateId) => void;
  forceVisible?: boolean;
  bannerRef?: React.RefObject<HTMLElement | null>;
};

const TEMPLATE_CARDS: Record<
  TemplateCategory,
  {
    id: keyof typeof TEMPLATE_THUMBNAIL_ILLUSTRATIONS;
    title: string;
    gradient: string;
    titleClassName: string;
  }[]
> = {
  brainstorm: [
    {
      id: "idea-sprint",
      title: "Idea sprint",
      gradient: "from-[#FFD166] via-[#FCBF49] to-[#F77F00]",
      titleClassName: "text-[#1F1408]",
    },
    {
      id: "mood-board",
      title: "Mood board",
      gradient: "from-[#9333EA] via-[#7E22CE] to-[#581C87]",
      titleClassName: "text-white",
    },
    {
      id: "concept-map",
      title: "Concept map",
      gradient: "from-[#2563EB] via-[#1D4ED8] to-[#1E3A8A]",
      titleClassName: "text-white",
    },
  ],
  reviews: [
    {
      id: "asset-review",
      title: "Asset review",
      gradient: "from-[#4ADE80] via-[#16A34A] to-[#14532D]",
      titleClassName: "text-[#052E16]",
    },
    {
      id: "campaign-checklist",
      title: "Campaign checklist",
      gradient: "from-[#F9A8D4] via-[#EC4899] to-[#9D174D]",
      titleClassName: "text-[#500724]",
    },
    {
      id: "client-signoff",
      title: "Client sign-off",
      gradient: "from-[#6366F1] via-[#4F46E5] to-[#312E81]",
      titleClassName: "text-white",
    },
  ],
};

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "brainstorm", label: "Brainstorm" },
  { id: "reviews", label: "Reviews" },
];

function storageKey(projectId: string) {
  return `hub-templates-dismissed-${projectId}`;
}

export function ProjectTemplatesBanner({
  projectId,
  onUseTemplate,
  forceVisible = false,
  bannerRef,
}: ProjectTemplatesBannerProps) {
  const [dismissed, setDismissed] = useState(true);
  const [category, setCategory] = useState<TemplateCategory>("brainstorm");

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey(projectId)) === "1");
  }, [projectId]);

  function dismiss() {
    localStorage.setItem(storageKey(projectId), "1");
    setDismissed(true);
  }

  if (dismissed && !forceVisible) return null;

  const cards = TEMPLATE_CARDS[category];

  return (
    <section
      ref={bannerRef}
      className={cn(
        "overflow-hidden rounded-md bg-hub-surface-muted",
        forceVisible && "relative z-[46]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <h2 className="font-display text-sm font-bold text-hub-foreground">
          Jump in with a template
        </h2>

        <div className="flex items-center gap-3">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                "text-[0.8125rem] transition-colors",
                category === item.id
                  ? "font-medium text-hub-foreground"
                  : "text-hub-foreground/45 hover:text-hub-foreground/70",
              )}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss templates"
            className="flex size-7 items-center justify-center rounded-[4px] text-hub-foreground/40 transition-colors hover:bg-hub-foreground/[0.05] hover:text-hub-foreground/70"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 min-[540px]:grid-cols-3">
        {cards.map((card) => {
          const Illustration = TEMPLATE_THUMBNAIL_ILLUSTRATIONS[card.id];

          return (
            <button
              key={card.id}
              type="button"
              aria-label={card.title}
              onClick={() => onUseTemplate?.(card.id)}
              className="group overflow-hidden rounded-md border border-hub-foreground/10 bg-hub-surface text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-primary/40"
            >
              <div
                className={cn(
                  "relative aspect-[16/10] overflow-hidden bg-gradient-to-br",
                  card.gradient,
                )}
              >
                <p
                  className={cn(
                    "absolute left-3.5 top-3.5 z-10 max-w-[75%] font-display text-[clamp(1.0625rem,3.8vw,1.3125rem)] font-bold leading-snug tracking-tight",
                    card.titleClassName,
                  )}
                >
                  {card.title}
                </p>

                <Illustration className="transition-transform duration-300 group-hover:translate-y-[-2px]" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
