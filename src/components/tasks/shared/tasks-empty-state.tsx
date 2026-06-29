"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { QuickAddTriggerButton } from "@/components/tasks/quick-add/quick-add-trigger-button";

import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

type TasksEmptyVariant = "today" | "upcoming" | "inbox" | "board" | "default";

type TasksEmptyStateProps = {
  variant?: TasksEmptyVariant;
  title?: string;
  description?: string;
  addTaskPlaceholder?: string;
  onQuickAdd?: () => void;
  onAddTask?: (name: string) => Promise<boolean> | boolean | void;
};

const EMPTY_COPY: Record<
  TasksEmptyVariant,
  { title: string; body: string; sectionLabel: string }
> = {
  today: {
    title: "Nothing planned for today",
    body: "Add what you want to finish before the day ends. Tasks with a due date of today show up here.",
    sectionLabel: "Today",
  },
  upcoming: {
    title: "Your schedule is clear",
    body: "Give tasks a due date and they'll line up here — sorted by what's coming next.",
    sectionLabel: "Upcoming",
  },
  inbox: {
    title: "Capture ideas as they arrive",
    body: "Quick, unscheduled tasks land in your inbox. Triage them when you're ready to plan.",
    sectionLabel: "Inbox",
  },
  board: {
    title: "Organize work in columns",
    body: "Create sections for each stage, then move tasks across the board as progress happens.",
    sectionLabel: "Board",
  },
  default: {
    title: "No tasks yet",
    body: "Capture work with Quick Add\nSmall steps add up to finish projects",
    sectionLabel: "Tasks",
  },
};

const PLACEHOLDER_TASK: Record<TasksEmptyVariant, string> = {
  today: "Your first task goes here",
  upcoming: "Your first task goes here",
  inbox: "Your first task goes here",
  board: "Your first task goes here",
  default: "Your first task goes here",
};

export function TasksEmptyState({
  variant = "default",
  title,
  description,
  addTaskPlaceholder = "What needs doing?",
  onQuickAdd,
  onAddTask,
}: TasksEmptyStateProps) {
  const [hydrated, setHydrated] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const copy = EMPTY_COPY[variant];
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ type: "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  const displayTitle = title ?? copy.title;
  const displayDescription = description ?? copy.body;
  const motionEnabled = hydrated && !reduced;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name || !onAddTask || isAdding) return;

    setIsAdding(true);
    setAddFeedback(null);

    try {
      const result = await onAddTask(name);
      if (result === false) {
        setAddFeedback({
          type: "error",
          message: "Could not add that task. Please try again.",
        });
        return;
      }
      setDraft("");
    } catch (err) {
      setAddFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Could not add that task. Please try again.",
      });
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="flex min-h-[min(56vh,30rem)] flex-col items-center justify-center px-4 py-12 sm:px-6">
      <motion.div
        initial={motionEnabled ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md text-center"
      >
        <h2 className="font-display text-[1.375rem] font-extrabold tracking-tight text-hub-foreground sm:text-2xl">
          {displayTitle}
        </h2>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-hub-foreground/55">
          {displayDescription.split("\n").map((line, index) => (
            <span key={line} className={cn(index > 0 && "mt-1 block")}>
              {line}
            </span>
          ))}
        </p>
      </motion.div>

      <motion.div
        initial={motionEnabled ? { opacity: 0, y: 16 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 w-full max-w-[15.75rem]"
      >
        {variant === "board" ? (
          <BoardPreviewHero reduced={reduced || !hydrated} />
        ) : (
          <TaskListPreviewHero
            variant={variant}
            sectionLabel={copy.sectionLabel}
            placeholderTask={PLACEHOLDER_TASK[variant]}
            reduced={reduced || !hydrated}
          />
        )}
      </motion.div>

      {onQuickAdd && (
        <motion.div
          initial={motionEnabled ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          <QuickAddTriggerButton onClick={onQuickAdd} />
        </motion.div>
      )}

      {onAddTask && (
        <motion.form
          initial={motionEnabled ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          onSubmit={handleSubmit}
          className="mt-5 w-full max-w-[22.5rem]"
        >
          <label htmlFor="tasks-empty-add-input" className="sr-only">
            Add your first task
          </label>
          <div className="flex min-h-11 items-center gap-2 rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-2 shadow-[0_1px_2px_rgba(11,11,11,0.04)] transition-[border-color,box-shadow] focus-within:border-hub-primary/35 focus-within:shadow-[0_0_0_3px_rgba(24,160,251,0.1)]">
            <span
              className="size-[1.375rem] shrink-0 rounded-full border border-hub-foreground/20 bg-hub-surface"
              aria-hidden
            />
            <input
              id="tasks-empty-add-input"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (addFeedback) setAddFeedback(null);
              }}
              placeholder={addTaskPlaceholder}
              disabled={isAdding}
              className="min-w-0 flex-1 bg-transparent text-[0.8125rem] text-hub-foreground outline-none placeholder:text-hub-foreground/35 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isAdding}
              className={cn(
                "shrink-0 rounded-[4px] px-2.5 py-1 text-[0.75rem] font-semibold transition-colors",
                draft.trim() && !isAdding
                  ? "bg-hub-foreground text-hub-paper hover:bg-hub-foreground/90"
                  : "text-hub-foreground/30",
              )}
            >
              {isAdding ? "Adding…" : "Add"}
            </button>
          </div>
          {addFeedback && (
            <p className="mt-2 text-center text-[0.75rem] text-hub-rejected" role="alert">
              {addFeedback.message}
            </p>
          )}
        </motion.form>
      )}
    </div>
  );
}

function TaskListPreviewHero({
  variant,
  sectionLabel,
  placeholderTask,
  reduced,
}: {
  variant: TasksEmptyVariant;
  sectionLabel: string;
  placeholderTask: string;
  reduced: boolean;
}) {
  const [checkPhase, setCheckPhase] = useState<"idle" | "pressing" | "checked">("idle");
  const [strikeThrough, setStrikeThrough] = useState(false);

  useEffect(() => {
    if (reduced) {
      const doneTimer = window.setTimeout(() => setCheckPhase("checked"), 1000);
      return () => window.clearTimeout(doneTimer);
    }

    const pressTimer = window.setTimeout(() => setCheckPhase("pressing"), 1000);
    const checkedTimer = window.setTimeout(() => setCheckPhase("checked"), 1350);

    return () => {
      window.clearTimeout(pressTimer);
      window.clearTimeout(checkedTimer);
    };
  }, [reduced]);

  useEffect(() => {
    if (checkPhase !== "checked") {
      setStrikeThrough(false);
      return;
    }

    const strikeTimer = window.setTimeout(() => setStrikeThrough(true), reduced ? 0 : 180);
    return () => window.clearTimeout(strikeTimer);
  }, [checkPhase, reduced]);

  const checked = checkPhase === "checked";

  return (
    <div
      className="overflow-hidden rounded-[5px] border border-hub-foreground/10 bg-hub-surface shadow-[0_1px_2px_rgba(11,11,11,0.05),0_8px_22px_rgba(11,11,11,0.06)]"
      aria-hidden
    >
      <div className="border-b border-hub-foreground/8 bg-hub-surface-muted/50 px-2 py-1.5">
        <p className="font-display text-[0.625rem] font-bold uppercase tracking-[0.08em] text-hub-foreground/45">
          {sectionLabel}
        </p>
      </div>

      <div className="p-1">
        <PreviewSkeletonRow reduced={reduced} delay={0} />

        <PreviewTaskRow
          name={placeholderTask}
          checked={checked}
          pressing={checkPhase === "pressing"}
          strikeThrough={strikeThrough}
          reduced={reduced}
          delay={0.08}
        />

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.35 }}
          className="mt-0.5 flex min-h-8 items-center gap-1.5 rounded-[5px] border border-dashed border-hub-foreground/10 px-1.5"
        >
          <span className="size-4 shrink-0 rounded-full border border-hub-foreground/15" aria-hidden />
          <span className="text-[0.6875rem] text-hub-foreground/35">
            {variant === "inbox" ? "Capture something new…" : "Add a task…"}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

function PreviewSkeletonRow({ reduced, delay }: { reduced: boolean; delay: number }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none flex min-h-8 items-center gap-1.5 rounded-[5px] border border-transparent px-1.5 py-1"
    >
      <SkeletonBone className="size-4 shrink-0 rounded-full" />
      <SkeletonBone className="h-3 max-w-[6.25rem] flex-1 rounded-md" />
      <SkeletonBone className="hidden h-3 w-10 shrink-0 rounded-full sm:block" />
    </motion.div>
  );
}

function PreviewTaskRow({
  name,
  checked,
  pressing,
  strikeThrough,
  reduced,
  delay,
}: {
  name: string;
  checked: boolean;
  pressing: boolean;
  strikeThrough: boolean;
  reduced: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none relative flex min-h-8 items-center gap-1.5 rounded-[5px] border border-transparent px-1.5 py-1"
    >
      <div className="relative shrink-0">
        {!reduced && pressing && (
          <>
            <motion.span
              className="pointer-events-none absolute -left-0.5 top-1/2 z-10 size-2 -translate-y-1/2 rounded-full border-2 border-white bg-hub-foreground/75 shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              initial={{ opacity: 0, x: 14, y: -6 }}
              animate={{ opacity: [0, 1, 1, 0], x: [14, 4, 0, 0], y: [-6, -2, 0, 0] }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-hub-primary/25"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.22 }}
              aria-hidden
            />
          </>
        )}

        <motion.span
          animate={
            pressing
              ? { scale: [1, 0.88, 1.06, 1] }
              : checked
                ? { scale: [1, 1.08, 1] }
                : { scale: 1 }
          }
          transition={{ duration: pressing ? 0.32 : 0.25, delay: pressing ? 0.18 : 0 }}
          className={cn(
            "relative flex size-4 items-center justify-center rounded-full border transition-colors",
            checked
              ? "border-hub-final bg-hub-final text-white"
              : "border-hub-foreground/25 bg-hub-surface",
          )}
        >
          {checked && (
            <motion.span
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              <Check className="size-2.5" strokeWidth={3} />
            </motion.span>
          )}
        </motion.span>
      </div>

      <div className="min-w-0 flex-1 text-left">
        <p
          className={cn(
            "truncate text-[0.6875rem] font-medium transition-[color,text-decoration-color] duration-300",
            strikeThrough
              ? "text-hub-foreground/45 line-through decoration-hub-foreground/35"
              : "text-hub-foreground",
          )}
        >
          {name}
        </p>
      </div>
    </motion.div>
  );
}

function BoardPreviewHero({ reduced }: { reduced: boolean }) {
  const columns = [
    { title: "To do", cards: ["Brief review", "Moodboard"] },
    { title: "In progress", cards: ["Homepage draft"] },
    { title: "Done", cards: ["Kickoff call"] },
  ];

  return (
    <div
      className="overflow-hidden rounded-[5px] border border-hub-foreground/10 bg-hub-surface shadow-[0_1px_2px_rgba(11,11,11,0.05),0_8px_22px_rgba(11,11,11,0.06)]"
      aria-hidden
    >
      <div className="flex gap-1.5 overflow-x-auto p-1.5">
        {columns.map((column, columnIndex) => (
          <motion.div
            key={column.title}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columnIndex * 0.08, duration: 0.4 }}
            className="w-[5.25rem] shrink-0 rounded-[5px] border border-hub-foreground/8 bg-hub-surface-muted/40 p-1.5"
          >
            <p className="mb-1.5 px-0.5 font-display text-[0.625rem] font-bold text-hub-foreground/55">
              {column.title}
            </p>
            <div className="space-y-1">
              {column.cards.map((card, cardIndex) => (
                <motion.div
                  key={card}
                  initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.12 + columnIndex * 0.06 + cardIndex * 0.05, duration: 0.35 }}
                  className="rounded-[3px] border border-hub-foreground/10 bg-hub-surface px-1.5 py-1 text-[0.625rem] font-medium text-hub-foreground/75 shadow-[0_1px_1px_rgba(11,11,11,0.04)]"
                >
                  {card}
                </motion.div>
              ))}
              <div className="rounded-[3px] border border-dashed border-hub-foreground/12 px-1.5 py-1 text-[0.5625rem] text-hub-foreground/30">
                + Add
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
