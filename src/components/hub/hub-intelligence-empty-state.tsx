"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  FolderKanban,
  ImageIcon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { HubIntelligenceProjectPicker } from "@/components/hub/hub-intelligence-project-picker";
import type { IntelligenceProjectOption } from "@/lib/intelligence/project-options";
import type { IntelligenceTemplateId } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils";

export type IntelligencePrompt = {
  id: IntelligenceTemplateId;
  label: string;
  description: string;
  example: string;
  icon: LucideIcon;
  accent: string;
  ring: string;
};

export const INTELLIGENCE_PROMPTS: IntelligencePrompt[] = [
  {
    id: "collaterals",
    label: "What collaterals do we have?",
    description: "Assets, canvases, documents, and links",
    example: "Summarize collaterals for this project",
    icon: ImageIcon,
    accent: "text-amber-600",
    ring: "ring-amber-400/25",
  },
  {
    id: "review",
    label: "Summarize review progress",
    description: "Approved, rejected, and pending assets",
    example: "How is review going?",
    icon: FolderKanban,
    accent: "text-hub-primary",
    ring: "ring-hub-primary/25",
  },
  {
    id: "blocking",
    label: "What's blocking this project?",
    description: "Overdue tasks and rejected assets",
    example: "What needs attention?",
    icon: AlertTriangle,
    accent: "text-rose-500",
    ring: "ring-rose-400/25",
  },
];

type HubIntelligenceEmptyStateProps = {
  activePromptId: IntelligenceTemplateId | null;
  expandedPromptId: IntelligenceTemplateId | null;
  showGlobalPicker: boolean;
  filterQuery?: string;
  projectScoped: boolean;
  projectOptions: IntelligenceProjectOption[];
  projectOptionsLoading: boolean;
  projectOptionsError: string | null;
  onPromptSelect: (prompt: IntelligencePrompt) => void;
  onProjectSelect: (
    project: IntelligenceProjectOption,
    prompt: IntelligencePrompt | null,
  ) => void;
};

export function HubIntelligenceEmptyState({
  activePromptId,
  expandedPromptId,
  showGlobalPicker,
  filterQuery = "",
  projectScoped,
  projectOptions,
  projectOptionsLoading,
  projectOptionsError,
  onPromptSelect,
  onProjectSelect,
}: HubIntelligenceEmptyStateProps) {
  const reduced = useReducedMotion();

  return (
    <div className="px-3 pb-3 pt-2">
      <div className="flex flex-col items-center px-2 pb-3 pt-1 text-center">
        <IntelligenceIllustration reduced={Boolean(reduced)} />

        <motion.p
          className="mt-3 font-display text-[0.95rem] font-extrabold tracking-tight text-hub-foreground/88"
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
        >
          Ask about a project
        </motion.p>
        <motion.p
          className="mt-1 text-xs leading-relaxed text-hub-foreground/38"
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35, ease: "easeOut" }}
        >
          {projectScoped
            ? "Pick a prompt or type a question — we'll gather collaterals, reviews, and tasks."
            : "Pick a prompt, choose a project, and we'll build your summary."}
        </motion.p>
      </div>

      <ul className="space-y-1" role="list">
        {INTELLIGENCE_PROMPTS.map((prompt, index) => {
          const Icon = prompt.icon;
          const isActive = activePromptId === prompt.id;
          const isExpanded = expandedPromptId === prompt.id;

          return (
            <motion.li
              key={prompt.id}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.12 + index * 0.05,
                duration: 0.32,
                ease: "easeOut",
              }}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onPromptSelect(prompt)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow,transform] duration-200",
                  isActive || isExpanded
                    ? "border-hub-primary/20 bg-hub-primary/8 shadow-[inset_0_0_0_1px_rgba(24,160,251,0.08)]"
                    : "border-transparent hover:border-hub-foreground/8 hover:bg-hub-foreground/[0.03] active:scale-[0.99]",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg bg-hub-foreground/[0.04] transition-transform duration-200 group-hover:scale-105",
                    (isActive || isExpanded) && "bg-hub-primary/10",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 transition-colors",
                      isActive || isExpanded
                        ? prompt.accent
                        : cn(prompt.accent, "opacity-80"),
                    )}
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium transition-colors",
                      isActive || isExpanded
                        ? "text-hub-foreground"
                        : "text-hub-foreground/72",
                    )}
                  >
                    {prompt.label}
                  </span>
                  <span className="block truncate text-xs text-hub-foreground/36 transition-colors group-hover:text-hub-foreground/44">
                    {prompt.description}
                  </span>
                </span>
              </button>

              {isExpanded && (
                <HubIntelligenceProjectPicker
                  projects={projectOptions}
                  loading={projectOptionsLoading}
                  error={projectOptionsError}
                  filterQuery={filterQuery}
                  onSelect={(project) => onProjectSelect(project, prompt)}
                />
              )}
            </motion.li>
          );
        })}
      </ul>

      {showGlobalPicker && (
        <div className="mt-2">
          <HubIntelligenceProjectPicker
            projects={projectOptions}
            loading={projectOptionsLoading}
            error={projectOptionsError}
            filterQuery={filterQuery}
            onSelect={(project) => onProjectSelect(project, null)}
          />
        </div>
      )}
    </div>
  );
}

function IntelligenceIllustration({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative size-[4.25rem]">
      <motion.div
        aria-hidden
        className="absolute inset-1 rounded-full bg-hub-primary/10 blur-2xl"
        animate={
          reduced
            ? undefined
            : {
                scale: [1, 1.08, 1],
                opacity: [0.45, 0.7, 0.45],
              }
        }
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-black/[0.07] bg-white/88 shadow-[0_2px_10px_rgba(0,0,0,0.07)] backdrop-blur-md"
        initial={reduced ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
      >
        <Sparkles
          className="size-4 text-hub-primary"
          strokeWidth={2}
          aria-hidden
        />
      </motion.div>
    </div>
  );
}
