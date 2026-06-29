"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

import { HubConfirmDialog } from "@/components/ui/hub-confirm-dialog";
import { reviewBoardStatusHref } from "@/lib/intelligence/deep-links";
import type { ReviewCommentBrief } from "@/lib/intelligence/types";
import { navigateHubContent } from "@/lib/hub/navigate-hub-content";
import { cn } from "@/lib/utils";

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 180;
const COMMENTS_PAGE_SIZE = 3;

const REVIEW_STATUS_TAG_STYLES = {
  approved:
    "border border-hub-approved/25 bg-hub-approved/10 text-hub-approved",
  rejected:
    "border border-hub-rejected/25 bg-hub-rejected/10 text-hub-rejected",
  pending:
    "border border-hub-pending/25 bg-hub-pending/10 text-hub-pending",
  neutral:
    "border border-hub-foreground/10 bg-hub-surface-muted text-hub-foreground/70",
} as const;

type ReviewStatusTone = keyof typeof REVIEW_STATUS_TAG_STYLES;

export function ReviewStatusTag({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone: ReviewStatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-xs font-medium leading-none",
        REVIEW_STATUS_TAG_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type HubEcosystemHoverCardProps = {
  children: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
  panelWidth?: number;
};

function HubEcosystemHoverCard({
  children,
  title,
  description,
  ctaLabel,
  onCtaClick,
  className,
  panelWidth = 240,
}: HubEcosystemHoverCardProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 12;

    let left = rect.left;
    left = Math.min(
      Math.max(viewportPadding, left),
      window.innerWidth - panelWidth - viewportPadding,
    );

    setCoords({
      top: rect.bottom + gap,
      left,
    });
  }, [panelWidth]);

  const scheduleOpen = useCallback(() => {
    clearTimers();
    openTimerRef.current = window.setTimeout(() => {
      updatePosition();
      setOpen(true);
    }, OPEN_DELAY_MS);
  }, [clearTimers, updatePosition]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, CLOSE_DELAY_MS);
  }, [clearTimers]);

  useEffect(() => {
    if (!open) return;

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex max-w-full cursor-default", className)}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
      >
        {children}
      </span>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-hub-ecosystem-root=""
            role="tooltip"
            style={{ top: coords.top, left: coords.left, width: panelWidth }}
            className="pointer-events-auto fixed z-[210] overflow-hidden rounded-md border border-hub-foreground/10 bg-hub-paper shadow-[0_10px_28px_rgba(11,11,11,0.14)] animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
          >
            <div className="space-y-1.5 px-3 py-2.5">
              <p className="text-xs font-semibold leading-snug text-hub-foreground">
                {title}
              </p>
              <p className="text-[0.6875rem] leading-relaxed text-hub-foreground/55">
                {description}
              </p>
            </div>
            {ctaLabel && onCtaClick ? (
              <div className="border-t border-hub-foreground/6 px-2.5 py-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCtaClick();
                    setOpen(false);
                  }}
                  className="w-full rounded-[6px] px-2 py-1.5 text-left text-xs font-medium text-hub-primary transition-colors hover:bg-hub-primary/8"
                >
                  {ctaLabel}
                </button>
              </div>
            ) : null}
          </div>,
          document.body,
        )}
    </>
  );
}

const STATUS_CONNECTION_COPY: Record<
  Exclude<ReviewStatusTone, "neutral">,
  { title: string; description: string; ctaLabel: string }
> = {
  approved: {
    title: "Approved assets",
    description: "These are ready to share, export, or move to final.",
    ctaLabel: "View approved assets →",
  },
  rejected: {
    title: "Rejected assets",
    description: "Jump in and see what needs another pass.",
    ctaLabel: "Review rejected assets →",
  },
  pending: {
    title: "Pending feedback",
    description: "These are still waiting for a decision from the team.",
    ctaLabel: "See pending assets →",
  },
};

type ReviewStatusConnectionProps = {
  tone: Exclude<ReviewStatusTone, "neutral">;
  count: number;
  label: string;
  projectId: string;
  reviewBoardId: string | null;
  onNavigate?: () => void;
};

export function ReviewStatusConnection({
  tone,
  count,
  label,
  projectId,
  reviewBoardId,
  onNavigate,
}: ReviewStatusConnectionProps) {
  const router = useRouter();
  const copy = STATUS_CONNECTION_COPY[tone];

  function handleNavigate() {
    if (!reviewBoardId || count === 0) return;

    const href = reviewBoardStatusHref(projectId, reviewBoardId, tone);
    navigateHubContent(router, {
      href,
      label: copy.title,
      kindHint: "file",
    });
    onNavigate?.();
  }

  if (count === 0) {
    return <ReviewStatusTag tone={tone}>{label}</ReviewStatusTag>;
  }

  return (
    <HubEcosystemHoverCard
      title={copy.title}
      description={copy.description}
      ctaLabel={reviewBoardId ? copy.ctaLabel : undefined}
      onCtaClick={reviewBoardId ? handleNavigate : undefined}
    >
      <ReviewStatusTag tone={tone} className="cursor-pointer">
        {label}
      </ReviewStatusTag>
    </HubEcosystemHoverCard>
  );
}

type RecentCommentsConnectionProps = {
  count: number;
  comments: ReviewCommentBrief[];
  onNavigate?: () => void;
};

export function RecentCommentsConnection({
  count,
  comments,
  onNavigate,
}: RecentCommentsConnectionProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [pendingComment, setPendingComment] = useState<ReviewCommentBrief | null>(
    null,
  );

  const open = hoverOpen || pinnedOpen;
  const totalPages = Math.max(1, Math.ceil(comments.length / COMMENTS_PAGE_SIZE));
  const pageComments = comments.slice(
    page * COMMENTS_PAGE_SIZE,
    page * COMMENTS_PAGE_SIZE + COMMENTS_PAGE_SIZE,
  );

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = 288;
    const gap = 8;
    const viewportPadding = 12;

    let left = rect.left;
    left = Math.min(
      Math.max(viewportPadding, left),
      window.innerWidth - panelWidth - viewportPadding,
    );

    setCoords({
      top: rect.bottom + gap,
      left,
    });
  }, []);

  const scheduleOpen = useCallback(() => {
    clearTimers();
    openTimerRef.current = window.setTimeout(() => {
      updatePosition();
      setHoverOpen(true);
    }, OPEN_DELAY_MS);
  }, [clearTimers, updatePosition]);

  const scheduleClose = useCallback(() => {
    if (pinnedOpen) return;
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setHoverOpen(false);
    }, CLOSE_DELAY_MS);
  }, [clearTimers, pinnedOpen]);

  useEffect(() => {
    if (!open) return;

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!pinnedOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      if ((target as Element).closest?.("dialog[open]")) return;
      setPinnedOpen(false);
      setHoverOpen(false);
      setPage(0);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [pinnedOpen]);

  function handleBadgeClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    updatePosition();
    setPinnedOpen(true);
    setHoverOpen(true);
  }

  function handleConfirmNavigate() {
    if (!pendingComment) return;

    navigateHubContent(router, {
      href: pendingComment.href,
      label: pendingComment.assetName,
      kindHint: "asset",
    });
    setPendingComment(null);
    onNavigate?.();
  }

  function handleCancelNavigate() {
    setPendingComment(null);
  }

  if (count <= 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleBadgeClick}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
        className={cn(
          "inline-flex items-center gap-1 rounded-[4px] border border-hub-foreground/10 bg-hub-surface-muted px-1.5 py-0.5 text-xs font-medium text-hub-foreground/50 transition-colors",
          open && "border-hub-primary/25 bg-hub-primary/6 text-hub-foreground/70",
        )}
      >
        <MessageCircle className="size-3 shrink-0 opacity-70" aria-hidden />
        {count} comments this week
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            data-hub-ecosystem-root=""
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-auto fixed z-[210] w-72 overflow-hidden rounded-md border border-hub-foreground/10 bg-hub-paper shadow-[0_12px_32px_rgba(11,11,11,0.16)] animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
          >
            <div className="border-b border-hub-foreground/6 px-3 py-2.5">
              <p className="text-xs font-semibold text-hub-foreground">
                Comments this week
              </p>
              <p className="mt-0.5 text-[0.6875rem] text-hub-foreground/50">
                {count} recent {count === 1 ? "comment" : "comments"} across review
                assets
              </p>
            </div>

            {comments.length === 0 ? (
              <p className="px-3 py-4 text-xs leading-relaxed text-hub-foreground/50">
                Rebuild the project brief to load comment previews.
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto py-1" role="list">
                {pageComments.map((comment) => (
                  <li key={comment.id}>
                    <CommentRow
                      comment={comment}
                      onView={() => setPendingComment(comment)}
                    />
                  </li>
                ))}
              </ul>
            )}

            {comments.length > COMMENTS_PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-hub-foreground/6 px-2 py-1.5">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  className="flex size-7 items-center justify-center rounded-[6px] text-hub-foreground/45 transition-colors hover:bg-hub-foreground/4 disabled:opacity-30"
                  aria-label="Previous comments"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="text-[0.65rem] text-hub-foreground/40">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages - 1, current + 1))
                  }
                  className="flex size-7 items-center justify-center rounded-[6px] text-hub-foreground/45 transition-colors hover:bg-hub-foreground/4 disabled:opacity-30"
                  aria-label="Next comments"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}

      <HubConfirmDialog
        open={pendingComment !== null}
        title="Want to check it out?"
        description={
          pendingComment ? (
            <>
              You&apos;ll jump to{" "}
              <span className="font-medium text-hub-foreground">
                {pendingComment.assetName}
              </span>{" "}
              and land right on this comment thread.
            </>
          ) : null
        }
        confirmLabel="Yes, take me there"
        cancelLabel="Stay here"
        tone="primary"
        onClose={handleCancelNavigate}
        onConfirm={handleConfirmNavigate}
      />
    </>
  );
}

function CommentRow({
  comment,
  onView,
}: {
  comment: ReviewCommentBrief;
  onView: () => void;
}) {
  const excerpt =
    comment.body.length > 120 ? `${comment.body.slice(0, 117)}…` : comment.body;

  return (
    <div className="group flex items-start gap-2 px-2 py-1.5 transition-colors hover:bg-hub-foreground/[0.03]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-hub-foreground">
          {comment.assetName}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-relaxed text-hub-foreground/50">
          <span className="font-medium text-hub-foreground/65">
            {comment.authorName}:
          </span>{" "}
          {excerpt}
        </p>
        <p className="mt-0.5 text-[0.6rem] text-hub-foreground/30">
          {new Date(comment.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onView();
        }}
        className="shrink-0 rounded-[6px] px-1.5 py-0.5 text-[0.62rem] font-medium text-hub-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-hub-primary/8"
      >
        View
      </button>
    </div>
  );
}
