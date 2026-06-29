"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ForYouLens } from "@/lib/routes";

const EMPTY_COPY: Record<
  ForYouLens,
  { title: string; body: string; gradient: string; shadow: string }
> = {
  "needs-you": {
    title: "You're all caught up",
    body: "@mentions and unresolved feedback on your uploads will appear here.",
    gradient: "from-hub-primary via-[#3db4ff] to-[#7c3aed]",
    shadow: "shadow-[0_12px_40px_rgba(24,160,251,0.35)]",
  },
  replies: {
    title: "No replies yet",
    body: "When someone replies in a thread you're part of, it will show up here.",
    gradient: "from-[#7c3aed] via-[#a855f7] to-hub-primary",
    shadow: "shadow-[0_12px_40px_rgba(124,58,237,0.32)]",
  },
  assigned: {
    title: "No assigned comments",
    body: "@mentions assigned to you will appear here.",
    gradient: "from-[#d97706] via-hub-final to-[#fbbf24]",
    shadow: "shadow-[0_12px_40px_rgba(255,201,75,0.35)]",
  },
  "waiting-on-others": {
    title: "Nothing pending from others",
    body: "Delegated tasks and uploads waiting on feedback will show up here.",
    gradient: "from-[#0891b2] via-[#0ea5e9] to-[#60a5fa]",
    shadow: "shadow-[0_12px_40px_rgba(14,165,233,0.28)]",
  },
  following: {
    title: "No following updates",
    body: "Threads and tasks you follow will appear as soon as they change.",
    gradient: "from-[#06b6d4] via-[#6366f1] to-[#8b5cf6]",
    shadow: "shadow-[0_12px_40px_rgba(99,102,241,0.28)]",
  },
  "your-uploads": {
    title: "No upload threads yet",
    body: "New feedback on files you uploaded appears here automatically.",
    gradient: "from-[#22c55e] via-[#14b8a6] to-[#06b6d4]",
    shadow: "shadow-[0_12px_40px_rgba(16,185,129,0.3)]",
  },
};

type ForYouEmptyStateProps = {
  lens?: ForYouLens;
};

export function ForYouEmptyState({ lens = "needs-you" }: ForYouEmptyStateProps) {
  const reduced = useReducedMotion();
  const copy = EMPTY_COPY[lens];

  return (
    <div className="flex min-h-[min(60vh,32rem)] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative">
        <motion.div
          aria-hidden
          className="absolute -inset-6 rounded-full bg-gradient-to-br from-hub-primary/20 via-hub-final/15 to-transparent blur-2xl"
          animate={
            reduced
              ? undefined
              : {
                  scale: [1, 1.08, 1],
                  opacity: [0.6, 0.9, 0.6],
                }
          }
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className={`relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br ${copy.gradient} ${copy.shadow}`}
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <EmptyIllustration lens={lens} reduced={Boolean(reduced)} />
        </motion.div>

        {!reduced && (
          <>
            <motion.span
              className="absolute -top-1 -right-2 size-2.5 rounded-full bg-hub-final"
              animate={{ y: [0, -4, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <motion.span
              className="absolute -bottom-1 -left-3 size-2 rounded-full bg-hub-primary"
              animate={{ y: [0, 3, 0], opacity: [0.5, 0.9, 0.5] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              }}
              aria-hidden
            />
          </>
        )}
      </div>

      <h2 className="mt-8 font-display text-xl font-extrabold tracking-tight text-hub-foreground sm:text-2xl">
        {copy.title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-hub-foreground/50">
        {copy.body}
      </p>
    </div>
  );
}

function EmptyIllustration({
  lens,
  reduced,
}: {
  lens: ForYouLens;
  reduced: boolean;
}) {
  switch (lens) {
    case "replies":
      return <RepliesIllustration reduced={reduced} />;
    case "assigned":
      return <AssignedIllustration reduced={reduced} />;
    case "waiting-on-others":
      return <WaitingIllustration reduced={reduced} />;
    case "following":
      return <FollowingIllustration reduced={reduced} />;
    case "your-uploads":
      return <UploadsIllustration reduced={reduced} />;
    case "needs-you":
    default:
      return <InboxIllustration reduced={reduced} />;
  }
}

function InboxIllustration({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-11 text-white" fill="none" aria-hidden>
      <motion.path
        d="M14 24l7 7 13-14"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      />
      <circle cx="36" cy="14" r="5" fill="#ffc94b" opacity="0.95" />
      <circle cx="10" cy="34" r="3" fill="white" opacity="0.35" />
    </svg>
  );
}

function RepliesIllustration({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-11" fill="none" aria-hidden>
      <motion.rect
        x="8"
        y="10"
        width="22"
        height="14"
        rx="4"
        fill="white"
        fillOpacity="0.92"
        initial={reduced ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.05 }}
        style={{ transformOrigin: "19px 17px" }}
      />
      <motion.path
        d="M14 24 L10 30 L18 26"
        fill="white"
        fillOpacity="0.92"
        initial={reduced ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      />
      <motion.rect
        x="18"
        y="22"
        width="22"
        height="14"
        rx="4"
        fill="white"
        fillOpacity="0.55"
        initial={reduced ? false : { x: 22, opacity: 0 }}
        animate={{ x: 18, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 }}
      />
      <motion.path
        d="M24 36 L20 42 L28 38"
        fill="white"
        fillOpacity="0.55"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      />
      <motion.path
        d="M28 18 C32 14 36 20 32 24"
        stroke="#ffc94b"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      />
    </svg>
  );
}

function AssignedIllustration({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-11" fill="none" aria-hidden>
      <motion.circle
        cx="24"
        cy="22"
        r="13"
        fill="white"
        fillOpacity="0.2"
        initial={reduced ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />
      <motion.text
        x="24"
        y="28"
        textAnchor="middle"
        fill="white"
        fontSize="20"
        fontWeight="700"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        initial={reduced ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
      >
        @
      </motion.text>
      <motion.rect
        x="30"
        y="30"
        width="12"
        height="12"
        rx="3"
        fill="white"
        fillOpacity="0.9"
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.25 }}
        style={{ transformOrigin: "36px 36px" }}
      />
      <motion.path
        d="M33 36 L35 38 L39 34"
        stroke="#7c3aed"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
      />
      <circle cx="12" cy="14" r="4" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

function WaitingIllustration({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-11" fill="none" aria-hidden>
      <motion.circle
        cx="24"
        cy="24"
        r="14"
        stroke="white"
        strokeOpacity="0.75"
        strokeWidth="2.6"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      <motion.path
        d="M24 16v8l5 3"
        stroke="#ffc94b"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay: 0.22, ease: "easeOut" }}
      />
      <circle cx="35" cy="15" r="3" fill="white" fillOpacity="0.35" />
    </svg>
  );
}

function FollowingIllustration({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-11" fill="none" aria-hidden>
      <motion.path
        d="M9 30c4-8 10-12 17-12s12 4 13 12"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55 }}
      />
      <motion.circle
        cx="24"
        cy="16"
        r="5"
        fill="white"
        fillOpacity="0.9"
        initial={reduced ? false : { y: 4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      />
      <motion.path
        d="M34 29l4 4 6-7"
        stroke="#ffc94b"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      />
    </svg>
  );
}

function UploadsIllustration({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-11" fill="none" aria-hidden>
      <motion.rect
        x="10"
        y="11"
        width="28"
        height="26"
        rx="5"
        fill="white"
        fillOpacity="0.2"
        initial={reduced ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      />
      <motion.path
        d="M24 31V18m0 0l-5 5m5-5l5 5"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay: 0.18 }}
      />
      <motion.path
        d="M16 33h16"
        stroke="#ffc94b"
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.45 }}
      />
    </svg>
  );
}
