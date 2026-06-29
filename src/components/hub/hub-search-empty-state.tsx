"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ClipboardList,
  FileText,
  FolderKanban,
  ImageIcon,
  Search,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchHintId = "project" | "document" | "task" | "asset";

export type SearchHint = {
  id: SearchHintId;
  label: string;
  description: string;
  example: string;
  icon: LucideIcon;
  accent: string;
  ring: string;
};

export const SEARCH_HINTS: SearchHint[] = [
  {
    id: "project",
    label: "Search by project",
    description: "Jump to a workspace or client folder",
    example: "Summer campaign",
    icon: FolderKanban,
    accent: "text-hub-primary",
    ring: "ring-hub-primary/25",
  },
  {
    id: "document",
    label: "Search by document",
    description: "Canvases, briefs, and text files",
    example: "brand guidelines",
    icon: FileText,
    accent: "text-indigo-500",
    ring: "ring-indigo-400/25",
  },
  {
    id: "task",
    label: "Search by task",
    description: "Assignments, to-dos, and action items",
    example: "fix headline",
    icon: ClipboardList,
    accent: "text-emerald-600",
    ring: "ring-emerald-400/25",
  },
  {
    id: "asset",
    label: "Search by asset",
    description: "Images, logos, and creative files",
    example: "logo lockup",
    icon: ImageIcon,
    accent: "text-amber-600",
    ring: "ring-amber-400/25",
  },
];

type HubSearchEmptyStateProps = {
  activeHintId: SearchHintId | null;
  onHintSelect: (hint: SearchHint) => void;
};

export function HubSearchEmptyState({
  activeHintId,
  onHintSelect,
}: HubSearchEmptyStateProps) {
  const reduced = useReducedMotion();

  return (
    <div className="px-3 pb-3 pt-2">
      <div className="flex flex-col items-center px-2 pb-3 pt-1 text-center">
        <SearchIllustration reduced={Boolean(reduced)} />

        <motion.p
          className="mt-3 font-display text-[0.95rem] font-extrabold tracking-tight text-hub-foreground/88"
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
        >
          What are you looking for?
        </motion.p>
        <motion.p
          className="mt-1 text-xs leading-relaxed text-hub-foreground/38"
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35, ease: "easeOut" }}
        >
          Start typing to search across projects, documents, tasks, and assets.
        </motion.p>
      </div>

      <ul className="space-y-1" role="list">
        {SEARCH_HINTS.map((hint, index) => {
          const Icon = hint.icon;
          const isActive = activeHintId === hint.id;

          return (
            <motion.li
              key={hint.id}
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
                onClick={() => onHintSelect(hint)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow,transform] duration-200",
                  isActive
                    ? "border-hub-primary/20 bg-hub-primary/8 shadow-[inset_0_0_0_1px_rgba(24,160,251,0.08)]"
                    : "border-transparent hover:border-hub-foreground/8 hover:bg-hub-foreground/[0.03] active:scale-[0.99]",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg bg-hub-foreground/[0.04] transition-transform duration-200 group-hover:scale-105",
                    isActive && "bg-hub-primary/10",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 transition-colors",
                      isActive ? hint.accent : cn(hint.accent, "opacity-80"),
                    )}
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium transition-colors",
                      isActive ? "text-hub-foreground" : "text-hub-foreground/72",
                    )}
                  >
                    {hint.label}
                  </span>
                  <span className="block truncate text-xs text-hub-foreground/36 transition-colors group-hover:text-hub-foreground/44">
                    {hint.description}
                  </span>
                </span>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[0.58rem] text-hub-foreground/28 transition-opacity sm:inline",
                    isActive
                      ? "border-hub-primary/15 bg-hub-primary/6 text-hub-foreground/42 opacity-100"
                      : "border-hub-foreground/8 bg-hub-foreground/[0.02] opacity-0 group-hover:opacity-100",
                  )}
                >
                  e.g. {hint.example}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-2.5 border-t border-hub-foreground/6 px-1 pt-2.5 text-center text-[0.62rem] tracking-wide text-hub-foreground/28">
        <kbd className="rounded border border-hub-foreground/10 bg-hub-foreground/[0.03] px-1 py-0.5 font-mono text-[0.58rem] text-hub-foreground/35">
          ↑↓
        </kbd>{" "}
        to navigate results{" "}
        <span className="text-hub-foreground/18">·</span>{" "}
        <kbd className="rounded border border-hub-foreground/10 bg-hub-foreground/[0.03] px-1 py-0.5 font-mono text-[0.58rem] text-hub-foreground/35">
          Esc
        </kbd>{" "}
        to close
      </p>
    </div>
  );
}

function SearchIllustration({ reduced }: { reduced: boolean }) {
  const orbitItems = [
    {
      Icon: FolderKanban,
      angle: -50,
      iconClass: "text-[#007AFF]",
      tileClass: "bg-[#007AFF]/12",
      delay: 0,
    },
    {
      Icon: FileText,
      angle: 40,
      iconClass: "text-[#5856D6]",
      tileClass: "bg-[#5856D6]/12",
      delay: 0.15,
    },
    {
      Icon: ClipboardList,
      angle: 130,
      iconClass: "text-[#34C759]",
      tileClass: "bg-[#34C759]/12",
      delay: 0.3,
    },
    {
      Icon: ImageIcon,
      angle: 220,
      iconClass: "text-[#FF9500]",
      tileClass: "bg-[#FF9500]/12",
      delay: 0.45,
    },
  ] as const;

  return (
    <div className="relative size-[4.25rem]">
      <motion.div
        aria-hidden
        className="absolute inset-1 rounded-full bg-hub-foreground/[0.04] blur-2xl"
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

      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-2.5 rounded-full border border-dashed border-hub-foreground/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        />
      )}

      {orbitItems.map(({ Icon, angle, iconClass, tileClass, delay }) => {
        const radius = 28;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        return (
          <motion.span
            key={angle}
            aria-hidden
            className={cn(
              "absolute left-1/2 top-1/2 flex size-[1.35rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[0.32rem] border border-black/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
              tileClass,
            )}
            style={{ x, y }}
            initial={reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={
              reduced
                ? { opacity: 1, scale: 1 }
                : {
                    opacity: [0.8, 1, 0.8],
                    scale: [0.96, 1.02, 0.96],
                  }
            }
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: reduced ? 0 : 0.1 + delay,
            }}
          >
            <Icon className={cn("size-2.5", iconClass)} strokeWidth={2.1} />
          </motion.span>
        );
      })}

      <motion.div
        className="absolute left-1/2 top-1/2 flex h-7 w-[3.35rem] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-black/[0.07] bg-white/88 px-2 shadow-[0_2px_10px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md"
        initial={reduced ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
      >
        <Search
          className="size-2.5 shrink-0 text-hub-foreground/32"
          strokeWidth={2.25}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 items-center">
          <motion.span
            aria-hidden
            className="h-[0.2rem] flex-1 rounded-full bg-hub-foreground/10"
            initial={reduced ? false : { scaleX: 0.4, opacity: 0.5 }}
            animate={
              reduced
                ? { scaleX: 1, opacity: 1 }
                : { scaleX: [0.55, 1, 0.55], opacity: [0.45, 0.75, 0.45] }
            }
            transition={{
              duration: 2.2,
              repeat: reduced ? 0 : Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "left center" }}
          />
          {!reduced && (
            <motion.span
              aria-hidden
              className="ml-0.5 size-[0.2rem] rounded-full bg-hub-foreground/28"
              animate={{ opacity: [0.2, 0.9, 0.2] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
