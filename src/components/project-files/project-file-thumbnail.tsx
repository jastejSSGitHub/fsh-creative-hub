"use client";

import type { CSSProperties } from "react";

import type { HubProjectFileType } from "@/types/database";
import {
  fileTypeDisplayLines,
  getFileTypeTheme,
  type FileTypeTheme,
} from "@/lib/project-files/file-type-themes";
import { cn } from "@/lib/utils";

type ProjectFileThumbnailProps = {
  type: HubProjectFileType;
  fileId: string;
  className?: string;
};

function ReviewBoardIllustration({ theme }: { theme: FileTypeTheme }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-end pr-3 pt-2 sm:pr-4"
    >
      <div className="relative h-[72%] w-[58%] max-w-[9.5rem]">
        <div
          className="hub-file-thumb-card hub-file-thumb-card--1 absolute left-[4%] top-[8%] h-[42%] w-[46%] rounded-[6px] border border-white/70 bg-hub-surface/85 shadow-[0_8px_20px_rgba(11,11,11,0.12)]"
          style={{ "--thumb-accent": theme.accent } as CSSProperties}
        >
          <div className="h-[3px] rounded-t-[5px] bg-hub-approved/80" />
          <div className="mt-1.5 px-1.5">
            <div className="h-1.5 w-full rounded-full bg-hub-foreground/8" />
            <div className="mt-1 h-1 w-2/3 rounded-full bg-hub-foreground/6" />
          </div>
        </div>

        <div
          className="hub-file-thumb-card hub-file-thumb-card--2 absolute right-[2%] top-[2%] h-[38%] w-[44%] rounded-[6px] border border-white/70 bg-hub-surface/85 shadow-[0_8px_20px_rgba(11,11,11,0.12)]"
          style={{ "--thumb-accent": theme.accent } as CSSProperties}
        >
          <div className="h-[3px] rounded-t-[5px] bg-hub-rejected/70" />
          <div className="mt-1.5 flex items-center justify-center">
            <span className="flex size-4 items-center justify-center rounded-full bg-hub-foreground/8 text-[0.5rem] font-bold text-hub-foreground/35">
              ?
            </span>
          </div>
        </div>

        <div
          className="hub-file-thumb-card hub-file-thumb-card--3 absolute bottom-[6%] left-[18%] h-[44%] w-[52%] rounded-[6px] border border-white/70 bg-hub-surface/90 shadow-[0_10px_24px_rgba(11,11,11,0.14)]"
          style={{ "--thumb-accent": theme.accent } as CSSProperties}
        >
          <div className="h-[3px] rounded-t-[5px] bg-hub-approved/80" />
          <div className="relative mt-2 px-2">
            <div className="aspect-[4/3] rounded-[4px] bg-gradient-to-br from-white to-hub-espresso/[0.06]" />
            <span className="hub-file-thumb-badge absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-hub-approved text-[0.55rem] font-extrabold text-white shadow-sm">
              ✓
            </span>
          </div>
        </div>

        <div
          className="hub-file-thumb-scan absolute inset-x-[8%] h-[2px] rounded-full opacity-70"
          style={{ backgroundColor: theme.accent }}
        />
      </div>
    </div>
  );
}

function TextDocumentIllustration({ theme }: { theme: FileTypeTheme }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-end pr-4 pt-3"
    >
      <div
        className="relative h-[72%] w-[58%] max-w-[9rem] rounded-[6px] border border-white/70 bg-hub-surface/90 p-2.5 shadow-[0_10px_24px_rgba(11,11,11,0.12)]"
        style={{ backgroundColor: theme.illustrationTint }}
      >
        <div className="h-1.5 w-2/3 rounded-full bg-hub-foreground/12" />
        <div className="mt-2 h-1 w-full rounded-full bg-hub-foreground/8" />
        <div className="mt-1 h-1 w-5/6 rounded-full bg-hub-foreground/6" />
        <div className="mt-1 h-1 w-4/6 rounded-full bg-hub-foreground/6" />
        <div className="mt-3 h-1 w-1/2 rounded-full bg-hub-foreground/10" />
        <div className="mt-1 h-1 w-full rounded-full bg-hub-foreground/6" />
      </div>
    </div>
  );
}

function CanvasIllustration({ theme }: { theme: FileTypeTheme }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-end pr-3 pt-2 sm:pr-4"
    >
      <div className="relative h-[74%] w-[56%] max-w-[9rem]">
        <div
          className="hub-file-thumb-card hub-file-thumb-card--1 absolute left-[6%] top-[10%] h-[78%] w-[72%] rotate-[-4deg] rounded-[8px] border border-white/75 bg-hub-surface/88 shadow-[0_10px_24px_rgba(11,11,11,0.12)]"
          style={{ backgroundColor: theme.illustrationTint }}
        >
          <div className="p-2">
            <div className="h-1.5 w-1/2 rounded-full bg-hub-foreground/10" />
            <div className="mt-3 h-8 w-full rounded-[4px] border border-dashed border-hub-foreground/12 bg-hub-surface/60" />
            <div className="mt-2 flex gap-1">
              <div className="h-4 w-4 rounded-full bg-[#f4a261]/70" />
              <div className="h-4 w-4 rounded-full bg-[#48cae4]/70" />
              <div className="h-4 w-4 rounded-full bg-[#c77dff]/70" />
            </div>
          </div>
        </div>

        <svg
          viewBox="0 0 80 80"
          className="hub-file-thumb-stroke absolute -right-1 bottom-[8%] h-[42%] w-[42%] text-hub-foreground/25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M8 58 C22 42, 34 68, 52 48 S72 28, 72 18" />
        </svg>
      </div>
    </div>
  );
}

export function ProjectFileThumbnail({
  type,
  fileId,
  className,
}: ProjectFileThumbnailProps) {
  const theme = getFileTypeTheme(type, fileId);
  const [lineOne, lineTwo] = fileTypeDisplayLines(type);

  return (
    <div
      className={cn(
        "hub-file-thumb relative size-full overflow-hidden bg-gradient-to-br",
        theme.gradient,
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -right-6 -top-6 size-28 rounded-full opacity-40 blur-2xl"
        style={{ backgroundColor: theme.accent }}
      />
      <div
        aria-hidden
        className="absolute -bottom-8 -left-4 size-24 rounded-full opacity-25 blur-2xl"
        style={{ backgroundColor: theme.accent }}
      />

      <div
        aria-hidden
        className="hub-file-thumb-shimmer absolute inset-0 opacity-60"
      />

      {type === "review_board" ? (
        <ReviewBoardIllustration theme={theme} />
      ) : type === "text_document" ? (
        <TextDocumentIllustration theme={theme} />
      ) : (
        <CanvasIllustration theme={theme} />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/[0.06] via-transparent to-transparent px-3.5 pb-3 pt-10 sm:px-4 sm:pb-3.5">
        <p
          className={cn(
            "font-display text-[1.65rem] font-black leading-[0.88] tracking-[-0.04em] sm:text-[1.85rem]",
            theme.labelPrimary,
          )}
        >
          {lineOne}
        </p>
        {lineTwo ? (
          <p
            className={cn(
              "font-display text-[1.65rem] font-black leading-[0.88] tracking-[-0.04em] sm:text-[1.85rem]",
              theme.labelSecondary,
            )}
          >
            {lineTwo}
          </p>
        ) : null}
      </div>
    </div>
  );
}
