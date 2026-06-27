"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { DocumentCoverBannerStatic } from "@/components/documents/document-cover";
import { NavBackLinkSkeleton } from "@/components/ui/nav-back-link";
import { SkeletonBone } from "@/components/ui/skeleton-primitives";
import {
  resolveDocumentCover,
  resolveDocumentIcon,
} from "@/lib/documents/defaults";
import { readTextDocumentNavigationSnapshot } from "@/lib/projects/text-document-snapshot";
import { cn } from "@/lib/utils";

function DocumentHeaderSkeleton({ docName }: { docName?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-hub-foreground/8 bg-hub-paper/95 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <NavBackLinkSkeleton className="max-w-none shrink-0" />

          <div className="hidden h-5 w-px shrink-0 bg-hub-foreground/12 sm:block" aria-hidden />

          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {docName ? (
              <>
                <SkeletonBone className="h-3.5 w-16 shrink-0 rounded-sm sm:w-20" />
                <SkeletonBone className="size-3 shrink-0 rounded-sm opacity-40" />
                <span className="truncate text-[0.8125rem] font-medium text-hub-foreground">
                  {docName}
                </span>
              </>
            ) : (
              <>
                <SkeletonBone className="h-3.5 w-16 shrink-0 rounded-sm sm:w-20" />
                <SkeletonBone className="size-3 shrink-0 rounded-sm opacity-40" />
                <SkeletonBone className="h-3.5 w-24 max-w-[40%] rounded-sm" />
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SkeletonBone className="hidden h-3 w-24 rounded-sm sm:block" />

          <div className="inline-flex items-center gap-0.5 rounded-[6px] border border-hub-foreground/10 bg-hub-surface/80 p-0.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBone key={index} className="size-7 rounded-[4px]" />
            ))}
          </div>

          <div className="inline-flex overflow-hidden rounded-[6px]">
            <SkeletonBone className="h-8 w-[5.5rem] rounded-none rounded-l-[6px]" />
            <SkeletonBone className="h-8 w-8 rounded-none rounded-r-[6px]" />
          </div>
        </div>
      </div>
    </header>
  );
}

function DocumentTitleSkeleton({ docName }: { docName?: string }) {
  return docName ? (
    <h1 className="w-full font-display text-[2.5rem] font-extrabold leading-tight tracking-tight text-hub-foreground">
      {docName}
    </h1>
  ) : (
    <SkeletonBone className="h-12 w-4/5 max-w-lg rounded-md" />
  );
}

function BlockEditorSkeleton() {
  const lines = [
    "w-full",
    "w-[92%]",
    "w-full",
    "w-[78%]",
    "w-[88%]",
    "w-[64%]",
  ];

  return (
    <div className="mt-4 space-y-5" aria-hidden>
      {lines.map((width, index) => (
        <div key={index} className="flex gap-2">
          <SkeletonBone className="mt-1.5 size-4 shrink-0 rounded-sm opacity-0" />
          <SkeletonBone className={cn("h-4 rounded-sm", width)} />
        </div>
      ))}
    </div>
  );
}

function DocumentScrollSpySkeleton() {
  const widths = ["w-8", "w-6", "w-4", "w-6"] as const;

  return (
    <aside
      aria-hidden
      className="pointer-events-none fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-1.5 xl:flex"
    >
      {widths.map((width, index) => (
        <div key={index} className="flex items-center gap-2">
          <SkeletonBone className="h-2 w-16 rounded-sm opacity-0" />
          <SkeletonBone className={cn("h-0.5 rounded-full", width)} />
        </div>
      ))}
    </aside>
  );
}

function parseTextDocumentPath(pathname: string): {
  projectId: string;
  docId: string;
} | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/docs\/([^/]+)/);
  if (!match) return null;
  return { projectId: match[1], docId: match[2] };
}

export function TextDocumentLoadingSkeleton() {
  const pathname = usePathname();

  const docPath = useMemo(() => parseTextDocumentPath(pathname), [pathname]);
  const snapshot = useMemo(() => {
    if (!docPath) return null;
    return readTextDocumentNavigationSnapshot(docPath.projectId, docPath.docId);
  }, [docPath]);

  const cover = resolveDocumentCover(
    snapshot?.cover ?? null,
    snapshot?.docName,
    docPath?.projectId,
    docPath?.docId,
  );
  const icon = resolveDocumentIcon(
    snapshot?.icon ?? null,
    docPath?.projectId,
    docPath?.docId,
  );

  return (
    <div
      className="relative min-h-[100dvh] pb-24"
      aria-busy="true"
      aria-label="Loading text document"
    >
      <DocumentHeaderSkeleton docName={snapshot?.docName} />

      <DocumentCoverBannerStatic cover={cover} />

      <div className="mx-auto w-[90%] px-4 sm:px-6">
        <div className="relative -mt-6 pt-4 sm:-mt-7 sm:pt-5">
          <div className="relative">
            <span
              className="pointer-events-none absolute left-0 bottom-full z-10 inline-flex translate-y-5 text-[3.5rem] leading-none sm:translate-y-6"
              aria-hidden
            >
              {icon}
            </span>

            <DocumentTitleSkeleton docName={snapshot?.docName} />
          </div>
        </div>

        <BlockEditorSkeleton />
      </div>

      <DocumentScrollSpySkeleton />
    </div>
  );
}
