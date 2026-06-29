"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { memberInitials } from "@/components/projects/member-avatar";
import type { CollaborationOnboardingIllustration } from "@/lib/collaboration-onboarding/types";
import { memberAvatarColor } from "@/lib/hub/member-avatar-color";
import { cn } from "@/lib/utils";

function MiniActorAvatar({
  displayName,
  colorSeed,
  stacked = false,
}: {
  displayName: string;
  colorSeed: string;
  stacked?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold text-white",
        stacked
          ? "relative size-3.5 border-2 border-white text-[0.4375rem]"
          : "size-4 text-[0.4375rem]",
      )}
      style={{ backgroundColor: memberAvatarColor(colorSeed) }}
    >
      {memberInitials(displayName)}
    </span>
  );
}

type CollaborationOnboardingIllustrationProps = {
  variant: CollaborationOnboardingIllustration;
  className?: string;
};

export function CollaborationOnboardingIllustration({
  variant,
  className,
}: CollaborationOnboardingIllustrationProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[5px] border border-hub-foreground/10 bg-hub-surface shadow-[0_1px_2px_rgba(11,11,11,0.05),0_8px_22px_rgba(11,11,11,0.06)]",
        className,
      )}
      aria-hidden
    >
      {(variant === "needs-you-feed" || variant === "generic") && (
        <NeedsYouFeedPreview reduced={reduced} />
      )}
      {variant === "privacy-feed" && <PrivacyFeedPreview reduced={reduced} />}
      {variant === "global-quick-add" && <QuickAddPreview reduced={reduced} />}
      {variant === "visibility-badge" && <VisibilityPreview reduced={reduced} />}
      {variant === "lenses-tab" && <LensesPreview reduced={reduced} />}
      {variant === "for-you-triage" && <TriagePreview reduced={reduced} />}
      {!["needs-you-feed", "generic", "privacy-feed", "global-quick-add", "visibility-badge", "lenses-tab", "for-you-triage"].includes(variant) && (
        <NeedsYouFeedPreview reduced={reduced} />
      )}
    </div>
  );
}

function NeedsYouFeedPreview({ reduced }: { reduced: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setPhase((p) => (p + 1) % 4), 900);
    return () => window.clearInterval(id);
  }, [reduced]);

  const rows = [
    {
      label: "@mention on Summer Poster",
      badge: "Mention",
      tone: "primary" as const,
      actorName: "Preeti",
      actorSeed: "preeti",
    },
    {
      label: "Fix headline",
      badge: "Overdue",
      tone: "danger" as const,
      actorName: "Sandeep",
      actorSeed: "sandeep",
    },
    {
      label: "Menu v3",
      badge: "Your vote",
      tone: "final" as const,
      actorName: "Creative Hub",
      actorSeed: "system",
    },
  ];

  const order = phase >= 2 ? [1, 0, 2] : [0, 1, 2];

  return (
    <div className="p-2">
      <p className="mb-1.5 px-1 font-display text-[0.625rem] font-bold uppercase tracking-[0.08em] text-hub-foreground/45">
        Needs you
      </p>
      <div className="space-y-1">
        {order.map((idx, i) => {
          const row = rows[idx];
          return (
            <motion.div
              key={row.label}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="flex items-center gap-1.5 rounded-[4px] border border-hub-foreground/8 bg-hub-surface-muted/40 px-1.5 py-1"
            >
              <MiniActorAvatar displayName={row.actorName} colorSeed={row.actorSeed} />
              <span className="min-w-0 flex-1 truncate text-[0.625rem] font-medium text-hub-foreground/80">
                {row.label}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded px-1 py-0.5 text-[0.5rem] font-bold uppercase",
                  row.tone === "danger" && "bg-hub-rejected/15 text-hub-rejected",
                  row.tone === "primary" && "bg-hub-primary/15 text-hub-primary",
                  row.tone === "final" && "bg-hub-final/20 text-hub-foreground/70",
                )}
              >
                {row.badge}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PrivacyFeedPreview({ reduced }: { reduced: boolean }) {
  const [checked, setChecked] = useState(false);
  const teamMembers = [
    { displayName: "Sandeep", colorSeed: "sandeep" },
    { displayName: "Preeti", colorSeed: "preeti" },
    { displayName: "Alex", colorSeed: "alex" },
  ] as const;

  useEffect(() => {
    if (reduced) {
      setChecked(true);
      return;
    }
    const t = window.setTimeout(() => setChecked(true), 1200);
    return () => window.clearTimeout(t);
  }, [reduced]);

  return (
    <div className="grid grid-cols-2 gap-1 p-1.5">
      <div className="rounded-[4px] border border-hub-foreground/10 p-1.5">
        <div className="mb-1 flex items-center gap-1 text-[0.5625rem] font-semibold text-hub-foreground/55">
          <Lock className="size-2.5" /> Personal
        </div>
        <div className="flex items-center gap-1">
          <motion.span
            animate={checked ? { scale: [1, 1.08, 1] } : {}}
            className={cn(
              "flex size-3.5 items-center justify-center rounded-full border",
              checked ? "border-hub-final bg-hub-final text-white" : "border-hub-foreground/25",
            )}
          >
            {checked && <Check className="size-2" strokeWidth={3} />}
          </motion.span>
          <span
            className={cn(
              "text-[0.625rem]",
              checked && "text-hub-foreground/45 line-through",
            )}
          >
            Private note
          </span>
        </div>
      </div>
      <div className="rounded-[4px] border border-hub-foreground/10 p-1.5">
        <div className="mb-1 flex items-center gap-1 text-[0.5625rem] font-semibold text-hub-foreground/55">
          <Users className="size-2.5" /> Project
        </div>
        <div className="flex -space-x-1">
          {teamMembers.map((member) => (
            <MiniActorAvatar
              key={member.colorSeed}
              displayName={member.displayName}
              colorSeed={member.colorSeed}
              stacked
            />
          ))}
        </div>
        <p className="mt-1 truncate text-[0.625rem] text-hub-foreground/75">Team task</p>
      </div>
    </div>
  );
}

function QuickAddPreview({ reduced }: { reduced: boolean }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (reduced) {
      setText("Brief review #Blenz");
      return;
    }
    const full = "Brief review tomorrow #Blenz @design";
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setText(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="p-2">
      <div className="mb-1 flex gap-1">
        <span className="rounded border border-hub-foreground/15 px-1 py-0.5 text-[0.5625rem] font-bold">
          Q
        </span>
        <span className="text-[0.5625rem] text-hub-foreground/45">Quick add</span>
      </div>
      <div className="rounded-[4px] border border-hub-primary/30 bg-hub-surface px-2 py-1.5 text-[0.625rem] text-hub-foreground">
        {text}
        {!reduced && <span className="animate-pulse">|</span>}
      </div>
    </div>
  );
}

function VisibilityPreview({ reduced }: { reduced: boolean }) {
  const badges = ["Personal", "Project", "Team"];
  return (
    <div className="space-y-1 p-2">
      {badges.map((badge, i) => (
        <motion.div
          key={badge}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center justify-between rounded-[4px] border border-hub-foreground/8 px-2 py-1"
        >
          <span className="text-[0.625rem] text-hub-foreground/70">Task {i + 1}</span>
          <span className="rounded border border-hub-foreground/12 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase text-hub-foreground/50">
            {badge}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function LensesPreview({ reduced }: { reduced: boolean }) {
  const [active, setActive] = useState(0);
  const lenses = ["Needs you", "Waiting", "Following"];

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % lenses.length), 1400);
    return () => window.clearInterval(id);
  }, [reduced, lenses.length]);

  return (
    <div className="p-2">
      <div className="mb-2 flex gap-1">
        {lenses.map((lens, i) => (
          <span
            key={lens}
            className={cn(
              "rounded-full px-2 py-0.5 text-[0.5rem] font-semibold transition-colors",
              i === active
                ? "bg-hub-foreground text-hub-paper"
                : "bg-hub-foreground/8 text-hub-foreground/50",
            )}
          >
            {lens}
          </span>
        ))}
      </div>
      <motion.div
        key={active}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-8 rounded-[4px] border border-dashed border-hub-foreground/12 bg-hub-foreground/[0.02]"
      />
    </div>
  );
}

function TriagePreview({ reduced }: { reduced: boolean }) {
  return (
    <div className="p-2">
      <motion.div
        animate={reduced ? {} : { x: [0, 24, 24] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
        className="flex items-center gap-1.5 rounded-[4px] border border-hub-foreground/10 px-2 py-1.5"
      >
        <MiniActorAvatar displayName="Preeti" colorSeed="preeti" />
        <span className="flex-1 text-[0.625rem] text-hub-foreground/70">@mention item</span>
        <span className="text-[0.5rem] text-hub-foreground/40">Snooze</span>
      </motion.div>
    </div>
  );
}
