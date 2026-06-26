"use client";

import { ClipboardList, Lightbulb, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type TemplateCategory = "brainstorm" | "reviews";

type ProjectTemplatesBannerProps = {
  projectId: string;
  onUseTemplate?: (category: TemplateCategory) => void;
};

const TEMPLATE_CARDS: Record<
  TemplateCategory,
  { id: string; title: string; gradient: string; icon: typeof Lightbulb }[]
> = {
  brainstorm: [
    {
      id: "idea-sprint",
      title: "Idea sprint",
      gradient: "from-[#fff4d6] via-[#ffe8a3] to-[#ffd76a]",
      icon: Lightbulb,
    },
    {
      id: "mood-board",
      title: "Mood board",
      gradient: "from-[#f3e8ff] via-[#e9d5ff] to-[#d8b4fe]",
      icon: Lightbulb,
    },
    {
      id: "concept-map",
      title: "Concept map",
      gradient: "from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc]",
      icon: Lightbulb,
    },
  ],
  reviews: [
    {
      id: "asset-review",
      title: "Asset review",
      gradient: "from-[#dcfce7] via-[#bbf7d0] to-[#86efac]",
      icon: ClipboardList,
    },
    {
      id: "campaign-checklist",
      title: "Campaign checklist",
      gradient: "from-[#ffe4e6] via-[#fecdd3] to-[#fda4af]",
      icon: ClipboardList,
    },
    {
      id: "client-signoff",
      title: "Client sign-off",
      gradient: "from-[#e0e7ff] via-[#c7d2fe] to-[#a5b4fc]",
      icon: ClipboardList,
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

  if (dismissed) return null;

  const cards = TEMPLATE_CARDS[category];

  return (
    <section className="overflow-hidden rounded-md border border-hub-espresso/10 bg-white/80">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <h2 className="font-display text-sm font-bold text-hub-espresso">
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
                  ? "font-medium text-hub-espresso"
                  : "text-hub-espresso/45 hover:text-hub-espresso/70",
              )}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss templates"
            className="flex size-7 items-center justify-center rounded-[4px] text-hub-espresso/40 transition-colors hover:bg-hub-espresso/[0.05] hover:text-hub-espresso/70"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 min-[540px]:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onUseTemplate?.(category)}
              className="group overflow-hidden rounded-md border border-hub-espresso/10 bg-white text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-primary/40"
            >
              <div
                className={cn(
                  "relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br",
                  card.gradient,
                )}
              >
                <Icon
                  className="size-8 text-hub-espresso/25 transition-transform group-hover:scale-105"
                  aria-hidden
                />
              </div>
              <div className="flex items-center gap-2 border-t border-hub-espresso/8 px-3 py-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-[3px] bg-hub-primary/10 text-hub-primary">
                  <Icon className="size-3" aria-hidden />
                </span>
                <span className="truncate text-[0.8125rem] font-medium text-hub-espresso">
                  {card.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
