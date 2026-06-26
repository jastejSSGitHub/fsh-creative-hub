"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const PHASES = [
  { id: "create", label: "Create project", duration: 4200 },
  { id: "drop", label: "Drop the work", duration: 4500 },
  { id: "invite", label: "Invite the team", duration: 4200 },
] as const;

type PhaseId = (typeof PHASES)[number]["id"];

const ASSET_SWATCHES = [
  "from-[#E85D4C] to-[#F4A261]",
  "from-[#2A9D8F] to-[#48CAE4]",
  "from-[#7B2CBF] to-[#C77DFF]",
];

const projectTitleClass = "text-[0.7rem] font-semibold text-hub-foreground";

function PhaseIndicator({ active }: { active: PhaseId }) {
  return (
    <div className="flex items-center gap-2">
      {PHASES.map((phase) => (
        <div key={phase.id} className="flex items-center gap-1.5">
          <motion.div
            className={cn(
              "h-1 rounded-full transition-colors",
              active === phase.id ? "w-6 bg-hub-accent" : "w-3 bg-hub-foreground/15",
            )}
            layout
          />
        </div>
      ))}
    </div>
  );
}

function CreatePhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="create"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col justify-between p-4 sm:p-5"
    >
      <div className="space-y-3">
        <p className={projectTitleClass}>Projects</p>
        <div className="grid grid-cols-2 gap-2">
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-md border border-hub-foreground/8 bg-hub-surface/60 p-3"
          >
            <div className="h-2 w-12 rounded-full bg-hub-foreground/10" />
            <div className="mt-3 h-8 rounded-lg bg-hub-foreground/5" />
          </motion.div>
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 320, damping: 24 }}
            className="rounded-md border border-hub-foreground/12 bg-hub-surface p-3 shadow-[0_8px_24px_rgba(11,11,11,0.08)]"
          >
            <div className="flex items-center justify-between">
              <span className={cn(projectTitleClass, "text-[0.65rem]")}>
                Spring Campaign
              </span>
              <span className="rounded-full bg-hub-accent/20 px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-wider text-hub-foreground/70">
                New
              </span>
            </div>
            <p className="mt-1 font-mono text-[0.5rem] text-hub-foreground/40">
              0 assets · Just now
            </p>
            <motion.div
              initial={reduced ? false : { width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
              className="mt-2 h-1 overflow-hidden rounded-full bg-hub-foreground/8"
            >
              <div className="h-full w-full rounded-full bg-hub-accent" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex items-center gap-2 rounded-lg border border-hub-foreground/8 bg-hub-foreground/[0.03] px-3 py-2"
      >
        <motion.span
          animate={reduced ? undefined : { scale: [1, 0.92, 1] }}
          transition={{ delay: 0.9, duration: 0.25 }}
          className="flex size-5 items-center justify-center rounded-md bg-hub-accent text-[0.65rem] font-bold text-hub-foreground"
        >
          +
        </motion.span>
        <span className="text-[0.65rem] text-hub-foreground/55">
          Project created — ready for work
        </span>
      </motion.div>
    </motion.div>
  );
}

function DropPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="drop"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className={projectTitleClass}>Spring Campaign</p>
          <p className="font-mono text-[0.5rem] text-hub-foreground/40">
            Drop assets here
          </p>
        </div>
        <span className="font-mono text-[0.5rem] text-hub-foreground/35">3 uploading</span>
      </div>

      <motion.div
        animate={
          reduced
            ? undefined
            : {
                borderColor: [
                  "rgba(11,11,11,0.12)",
                  "rgba(255,201,75,0.55)",
                  "rgba(11,11,11,0.12)",
                ],
              }
        }
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.4 }}
        className="relative flex-1 rounded-xl border-2 border-dashed border-hub-foreground/12 bg-hub-surface/50 p-3"
      >
        <div className="grid h-full grid-cols-3 gap-2">
          {ASSET_SWATCHES.map((swatch, i) => (
            <motion.div
              key={swatch}
              initial={
                reduced
                  ? false
                  : { opacity: 0, y: -28, scale: 0.85, rotate: -4 + i * 4 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{
                delay: 0.35 + i * 0.22,
                type: "spring",
                stiffness: 280,
                damping: 22,
              }}
              className="relative overflow-hidden rounded-lg shadow-md"
            >
              <div className={cn("aspect-[4/5] bg-gradient-to-br", swatch)} />
              <motion.div
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1 + i * 0.15, duration: 0.35 }}
                className="absolute inset-x-0 bottom-0 h-1 origin-left bg-hub-approved"
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.35 }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-hub-espresso px-3 py-1 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper"
        >
          3 assets added
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function InvitePhase({ reduced }: { reduced: boolean }) {
  const members = [
    { initials: "JS", color: "from-[#3A86FF] to-[#8338EC]" },
    { initials: "SP", color: "from-[#06D6A0] to-[#118AB2]" },
    { initials: "AK", color: "from-[#FF6B6B] to-[#FFE66D]" },
  ];

  return (
    <motion.div
      key="invite"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 pb-5 sm:p-5 sm:pb-6"
    >
      <div>
        <p className={projectTitleClass}>Share project</p>
        <div className="mt-3 rounded-lg border border-hub-foreground/10 bg-hub-surface p-3 pb-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.map((member, i) => (
                <motion.div
                  key={member.initials}
                  initial={reduced ? false : { opacity: 0, x: -12, scale: 0.6 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    delay: 0.3 + i * 0.18,
                    type: "spring",
                    stiffness: 400,
                    damping: 22,
                  }}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br text-[0.55rem] font-semibold text-white",
                    member.color,
                  )}
                >
                  {member.initials}
                </motion.div>
              ))}
              <motion.div
                initial={reduced ? false : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.95, type: "spring", stiffness: 500, damping: 20 }}
                className="flex size-8 items-center justify-center rounded-full border-2 border-dashed border-hub-foreground/20 bg-hub-paper text-[0.55rem] text-hub-foreground/40"
              >
                +
              </motion.div>
            </div>
            <motion.p
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-[0.65rem] text-hub-foreground/55"
            >
              3 collaborators
            </motion.p>
          </div>

          <motion.div
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-3 space-y-1.5 overflow-hidden"
          >
            {["sandeep@fsh.example.email", "preeti@fsh.example.email"].map((email, i) => (
              <motion.div
                key={email}
                initial={reduced ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.85 + i * 0.2 }}
                className="flex items-center justify-between rounded-lg bg-hub-foreground/[0.04] px-2.5 py-1.5"
              >
                <span className="font-mono text-[0.55rem] text-hub-foreground/60">
                  {email}
                </span>
                <motion.span
                  initial={reduced ? false : { opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 + i * 0.25, type: "spring" }}
                  className="text-[0.6rem] text-hub-approved"
                >
                  ✓
                </motion.span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="mt-4 flex justify-center pb-1"
          >
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-hub-espresso px-4 py-2.5 text-center">
              <span className="size-1.5 shrink-0 rounded-full bg-hub-accent" />
              <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-hub-paper/80">
                Invites sent · Team is in
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectsWorkflowIllustration() {
  const reduced = !!useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const activePhase = PHASES[phaseIndex].id;

  useEffect(() => {
    if (reduced) return;

    const duration = PHASES[phaseIndex].duration;
    const timer = window.setTimeout(() => {
      setPhaseIndex((current) => (current + 1) % PHASES.length);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [phaseIndex, reduced]);

  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-lg border border-hub-foreground/10 bg-gradient-to-b from-white to-hub-paper shadow-[0_16px_48px_rgba(11,11,11,0.06)]"
    >
      <div className="flex items-center justify-between border-b border-hub-foreground/8 bg-hub-foreground/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-hub-foreground/15" />
            <span className="size-2 rounded-full bg-hub-foreground/15" />
            <span className="size-2 rounded-full bg-hub-foreground/15" />
          </div>
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-hub-foreground/35">
            FSH Creative Hub
          </span>
        </div>
        <PhaseIndicator active={activePhase} />
      </div>

      <div className="relative h-[11.5rem] sm:h-[12.5rem]">
        <AnimatePresence mode="wait">
          {activePhase === "create" && <CreatePhase reduced={reduced} />}
          {activePhase === "drop" && <DropPhase reduced={reduced} />}
          {activePhase === "invite" && <InvitePhase reduced={reduced} />}
        </AnimatePresence>
      </div>

      <div className="border-t border-hub-foreground/8 px-4 py-2">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-hub-foreground/40">
          {PHASES[phaseIndex].label}
        </p>
      </div>
    </div>
  );
}
