"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  PenTool,
  RefreshCw,
} from "lucide-react";
import { useState, type MouseEvent } from "react";

import {
  RecentCommentsConnection,
  ReviewStatusConnection,
  ReviewStatusTag,
} from "@/components/hub/hub-ecosystem-connection";
import {
  AssetMediaPreview,
  inferAssetMediaType,
} from "@/components/workspace/asset-media-preview";
import type {
  BriefItem,
  IntelligenceView,
  ProjectBrief,
  ReviewSummary,
} from "@/lib/intelligence/types";
import { navigateHubContent } from "@/lib/hub/navigate-hub-content";
import { projectBriefPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type HubIntelligenceResultProps = {
  brief: ProjectBrief;
  view: IntelligenceView;
  isProjectAdmin: boolean;
  fromCache: boolean;
  onRebuild?: () => void;
  rebuilding?: boolean;
  compact?: boolean;
  onNavigate?: () => void;
};

function ReviewSummaryIntro({
  summary,
  projectId,
  onNavigate,
}: {
  summary: ReviewSummary;
  projectId: string;
  onNavigate?: () => void;
}) {
  if (summary.total === 0) {
    return (
      <span className="text-xs text-hub-foreground/50">
        No review assets uploaded yet.
      </span>
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-relaxed text-hub-foreground/50">
      <span>{summary.total} assets —</span>
      <ReviewStatusConnection
        tone="approved"
        count={summary.approved}
        label={`${summary.approved} approved`}
        projectId={projectId}
        reviewBoardId={summary.reviewBoardId}
        onNavigate={onNavigate}
      />
      <ReviewStatusConnection
        tone="rejected"
        count={summary.rejected}
        label={`${summary.rejected} rejected`}
        projectId={projectId}
        reviewBoardId={summary.reviewBoardId}
        onNavigate={onNavigate}
      />
      <ReviewStatusConnection
        tone="pending"
        count={summary.pending}
        label={`${summary.pending} pending`}
        projectId={projectId}
        reviewBoardId={summary.reviewBoardId}
        onNavigate={onNavigate}
      />
    </p>
  );
}

function ItemIcon({ item }: { item: BriefItem }) {
  if (item.kind === "asset") {
    return <ImageIcon className="size-3.5 shrink-0 text-amber-600" />;
  }
  if (item.kind === "task") {
    return <ClipboardList className="size-3.5 shrink-0 text-emerald-600" />;
  }
  if (item.kind === "doc_block") {
    return <FileText className="size-3.5 shrink-0 text-indigo-500" />;
  }
  if (item.kind === "url") {
    return <Link2 className="size-3.5 shrink-0 text-sky-500" />;
  }
  if (item.kind === "canvas_node") {
    return <PenTool className="size-3.5 shrink-0 text-purple-500" />;
  }
  return <FileText className="size-3.5 shrink-0 text-hub-foreground/45" />;
}

function BriefItemVisual({ item }: { item: BriefItem }) {
  const [failed, setFailed] = useState(false);

  if (item.thumbnailUrl && !failed) {
    const mediaType =
      item.mediaType ?? inferAssetMediaType(item.thumbnailUrl);

    if (mediaType === "video") {
      return (
        <div className="relative size-9 shrink-0 overflow-hidden rounded-[3px] border border-hub-foreground/8 bg-hub-foreground/[0.04]">
          <AssetMediaPreview
            type="video"
            src={item.thumbnailUrl}
            alt={item.label}
            className="size-full"
            playMode="static"
          />
        </div>
      );
    }

    return (
      <div className="size-9 shrink-0 overflow-hidden rounded-[3px] border border-hub-foreground/8 bg-hub-foreground/[0.04]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailUrl}
          alt=""
          loading="eager"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-[3px] border border-hub-foreground/8 bg-hub-foreground/[0.03]">
      <ItemIcon item={item} />
    </div>
  );
}

function ReviewStatsRow({
  summary,
  projectId,
  onNavigate,
}: {
  summary: ReviewSummary;
  projectId: string;
  onNavigate?: () => void;
}) {
  if (summary.total === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <ReviewStatusTag tone="neutral">Total {summary.total}</ReviewStatusTag>
      <ReviewStatusConnection
        tone="approved"
        count={summary.approved}
        label={`Approved ${summary.approved}`}
        projectId={projectId}
        reviewBoardId={summary.reviewBoardId}
        onNavigate={onNavigate}
      />
      <ReviewStatusConnection
        tone="rejected"
        count={summary.rejected}
        label={`Rejected ${summary.rejected}`}
        projectId={projectId}
        reviewBoardId={summary.reviewBoardId}
        onNavigate={onNavigate}
      />
      <ReviewStatusConnection
        tone="pending"
        count={summary.pending}
        label={`Pending ${summary.pending}`}
        projectId={projectId}
        reviewBoardId={summary.reviewBoardId}
        onNavigate={onNavigate}
      />
      {summary.recentCommentCount > 0 && (
        <RecentCommentsConnection
          count={summary.recentCommentCount}
          comments={summary.recentComments ?? []}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

function BriefItemRow({
  item,
  onNavigate,
}: {
  item: BriefItem;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  function handleOpen(event: MouseEvent) {
    event.preventDefault();
    navigateHubContent(router, {
      href: item.href,
      label: item.label,
      kindHint: item.kind,
    });
    onNavigate?.();
  }

  function handlePrefetch() {
    if (!item.openInNewTab && !item.href.startsWith("http")) {
      router.prefetch(item.href);
    }
  }

  return (
    <div
      className="group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-hub-foreground/[0.03]"
      onMouseEnter={handlePrefetch}
    >
      <BriefItemVisual item={item} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-hub-foreground">
          {item.label}
        </p>
        {item.excerpt && (
          <p className="line-clamp-2 text-xs text-hub-foreground/42">
            {item.excerpt}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {item.openInNewTab || item.href.startsWith("http") ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onNavigate?.()}
            className="rounded-md px-1.5 py-0.5 text-[0.62rem] font-medium text-hub-primary hover:bg-hub-primary/8"
          >
            Open
          </a>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-md px-1.5 py-0.5 text-[0.62rem] font-medium text-hub-primary hover:bg-hub-primary/8"
          >
            Open
          </button>
        )}
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onNavigate?.()}
          className="flex size-6 items-center justify-center rounded-md text-hub-foreground/35 hover:bg-hub-foreground/5 hover:text-hub-foreground/60"
          aria-label={`Open ${item.label} in new tab`}
        >
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

export function HubIntelligenceResult({
  brief,
  view,
  isProjectAdmin,
  fromCache,
  onRebuild,
  rebuilding = false,
  compact = false,
  onNavigate,
}: HubIntelligenceResultProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? view.items : view.items.slice(0, compact ? 6 : 10);

  return (
    <div className="flex max-h-[min(70vh,32rem)] flex-col">
      <div className="border-b border-hub-foreground/6 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-hub-foreground/35">
              {brief.projectName}
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-hub-foreground">
              {view.title}
            </h3>
            {view.templateId === "review" && view.reviewSummary ? (
              <div className="mt-1">
                <ReviewSummaryIntro
                  summary={view.reviewSummary}
                  projectId={brief.projectId}
                  onNavigate={onNavigate}
                />
              </div>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-hub-foreground/50">
                {view.summary}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isProjectAdmin && onRebuild && (
              <button
                type="button"
                onClick={onRebuild}
                disabled={rebuilding}
                className="flex size-7 items-center justify-center rounded-md text-hub-foreground/40 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground/70 disabled:opacity-50"
                aria-label="Rebuild project brief"
                title="Rebuild brief (admins only)"
              >
                <RefreshCw
                  className={cn("size-3.5", rebuilding && "animate-spin")}
                />
              </button>
            )}
            {!compact && (
              <Link
                href={projectBriefPath(brief.projectId)}
                className="rounded-md px-2 py-1 text-[0.65rem] font-medium text-hub-primary hover:bg-hub-primary/8"
              >
                Full page
              </Link>
            )}
          </div>
        </div>

        {view.reviewSummary &&
          (view.templateId === "review" ? (
            view.reviewSummary.recentCommentCount > 0 && (
              <div className="mt-2.5">
                <RecentCommentsConnection
                  count={view.reviewSummary.recentCommentCount}
                  comments={view.reviewSummary.recentComments ?? []}
                  onNavigate={onNavigate}
                />
              </div>
            )
          ) : (
            <div className="mt-2.5">
              <ReviewStatsRow
                summary={view.reviewSummary}
                projectId={brief.projectId}
                onNavigate={onNavigate}
              />
            </div>
          ))}

        {view.labels && view.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {view.labels.slice(0, 8).map((label) => (
              <span
                key={label}
                className="rounded-full border border-hub-foreground/8 px-2 py-0.5 text-[0.62rem] text-hub-foreground/45"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <p className="mt-2 text-[0.58rem] text-hub-foreground/28">
          {fromCache ? "From snapshot" : "Freshly built"} ·{" "}
          {new Date(brief.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {visibleItems.length === 0 ? (
          <p className="px-3 py-4 text-sm text-hub-foreground/45">
            No matching items for this question.
          </p>
        ) : (
          <ul role="list">
            {visibleItems.map((item) => (
              <li key={item.id}>
                <BriefItemRow item={item} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        )}

        {view.items.length > visibleItems.length && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mx-3 mb-2 mt-1 w-[calc(100%-1.5rem)] rounded-lg border border-hub-foreground/8 py-1.5 text-xs font-medium text-hub-foreground/55 hover:bg-hub-foreground/[0.03]"
          >
            Show {view.items.length - visibleItems.length} more
          </button>
        )}
      </div>
    </div>
  );
}
