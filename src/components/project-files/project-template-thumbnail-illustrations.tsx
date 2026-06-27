"use client";

import { cn } from "@/lib/utils";

export type TemplateIllustrationProps = {
  className?: string;
};

function MiniCard({
  className,
  rotate = 0,
  children,
}: {
  className?: string;
  rotate?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-[5px] border border-white/70 bg-white/95 shadow-[0_6px_16px_rgba(11,11,11,0.14)]",
        className,
      )}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </div>
  );
}

export function IdeaSprintIllustration({ className }: TemplateIllustrationProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[62%]", className)} aria-hidden>
      <MiniCard className="left-[8%] top-[18%] h-[52%] w-[38%]" rotate={-8}>
        <div className="h-full bg-[#FFF3B0] p-1.5">
          <div className="space-y-0.5">
            <div className="h-0.5 w-full rounded-full bg-black/12" />
            <div className="h-0.5 w-4/5 rounded-full bg-black/10" />
            <div className="h-0.5 w-2/3 rounded-full bg-black/8" />
          </div>
        </div>
      </MiniCard>

      <MiniCard className="left-[32%] top-[4%] h-[48%] w-[36%]" rotate={4}>
        <div className="h-full bg-[#C8F0D8] p-1.5">
          <div className="space-y-0.5">
            <div className="h-0.5 w-full rounded-full bg-black/12" />
            <div className="h-0.5 w-3/4 rounded-full bg-black/8" />
          </div>
        </div>
      </MiniCard>

      <MiniCard className="right-[6%] top-[22%] h-[54%] w-[40%]" rotate={-3}>
        <div className="flex h-full flex-col items-center justify-center bg-white p-1">
          <div className="flex size-5 items-center justify-center rounded-full border-2 border-[#FF6B35]/40">
            <span className="text-[0.45rem] font-bold text-[#FF6B35]">15m</span>
          </div>
          <div className="mt-1 h-0.5 w-3/4 rounded-full bg-black/10" />
        </div>
      </MiniCard>
    </div>
  );
}

export function MoodBoardIllustration({ className }: TemplateIllustrationProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[62%]", className)} aria-hidden>
      <MiniCard className="left-[6%] top-[20%] h-[50%] w-[34%]" rotate={-6}>
        <div className="grid h-full grid-cols-2 gap-0.5 p-1">
          <div className="rounded-[2px] bg-[#FECACA]" />
          <div className="rounded-[2px] bg-[#FDE68A]" />
          <div className="rounded-[2px] bg-[#A7F3D0]" />
          <div className="rounded-[2px] bg-[#BFDBFE]" />
        </div>
      </MiniCard>

      <MiniCard className="left-[28%] top-[6%] h-[46%] w-[32%]" rotate={5}>
        <div className="h-full bg-gradient-to-br from-[#F472B6] via-[#C084FC] to-[#60A5FA] p-0.5">
          <div className="h-full rounded-[3px] bg-white/20" />
        </div>
      </MiniCard>

      <MiniCard className="right-[5%] top-[18%] h-[52%] w-[38%]" rotate={-4}>
        <div className="relative h-full p-1">
          <div className="aspect-[4/3] rounded-[3px] bg-gradient-to-br from-[#78716C] to-[#D6D3D1]" />
          <div className="absolute bottom-1.5 left-1.5 h-1 w-2 rounded-full bg-white/80" />
        </div>
      </MiniCard>
    </div>
  );
}

export function ConceptMapIllustration({ className }: TemplateIllustrationProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[62%]", className)} aria-hidden>
      <MiniCard className="left-[4%] top-[24%] h-[48%] w-[42%]" rotate={-5}>
        <svg viewBox="0 0 80 48" className="h-full w-full">
          <line x1="40" y1="24" x2="18" y2="12" stroke="#93C5FD" strokeWidth="2" />
          <line x1="40" y1="24" x2="62" y2="10" stroke="#93C5FD" strokeWidth="2" />
          <line x1="40" y1="24" x2="52" y2="38" stroke="#93C5FD" strokeWidth="2" />
          <circle cx="40" cy="24" r="7" fill="#3B82F6" />
          <circle cx="18" cy="12" r="5" fill="#60A5FA" />
          <circle cx="62" cy="10" r="5" fill="#818CF8" />
          <circle cx="52" cy="38" r="5" fill="#38BDF8" />
        </svg>
      </MiniCard>

      <MiniCard className="right-[8%] top-[8%] h-[44%] w-[36%]" rotate={6}>
        <div className="flex h-full items-center justify-center p-1">
          <div className="relative size-8">
            <div className="absolute left-1 top-2 size-2.5 rounded-full bg-[#3B82F6]" />
            <div className="absolute right-0 top-0 size-2 rounded-full bg-[#818CF8]" />
            <div className="absolute bottom-0 left-3 size-2 rounded-full bg-[#38BDF8]" />
            <svg className="absolute inset-0" viewBox="0 0 32 32">
              <line x1="10" y1="14" x2="24" y2="6" stroke="#BFDBFE" strokeWidth="1.5" />
              <line x1="10" y1="14" x2="16" y2="26" stroke="#BFDBFE" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

export function AssetReviewIllustration({ className }: TemplateIllustrationProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[62%]", className)} aria-hidden>
      <MiniCard className="left-[10%] top-[16%] h-[50%] w-[36%]" rotate={-7}>
        <div className="relative p-1">
          <div className="aspect-[4/3] rounded-[3px] bg-gradient-to-br from-[#E7E5E4] to-[#A8A29E]" />
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#22C55E] text-[0.45rem] font-bold text-white">
            ✓
          </span>
        </div>
      </MiniCard>

      <MiniCard className="left-[34%] top-[4%] h-[44%] w-[32%]" rotate={5}>
        <div className="relative p-1">
          <div className="aspect-[4/3] rounded-[3px] bg-gradient-to-br from-[#FDE68A] to-[#F59E0B]" />
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#EF4444] text-[0.45rem] font-bold text-white">
            ✕
          </span>
        </div>
      </MiniCard>

      <MiniCard className="right-[4%] top-[20%] h-[52%] w-[38%]" rotate={-3}>
        <div className="p-1.5">
          <div className="aspect-[4/3] rounded-[3px] bg-gradient-to-br from-[#DDD6FE] to-[#8B5CF6]" />
          <div className="mt-1 flex gap-0.5">
            <div className="h-1 flex-1 rounded-full bg-black/10" />
            <div className="h-1 w-2 rounded-full bg-[#22C55E]/40" />
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

export function CampaignChecklistIllustration({ className }: TemplateIllustrationProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[62%]", className)} aria-hidden>
      <MiniCard className="left-[8%] top-[14%] h-[54%] w-[40%]" rotate={-6}>
        <div className="space-y-1 p-1.5">
          {[
            { checked: true, width: "w-full" },
            { checked: true, width: "w-4/5" },
            { checked: false, width: "w-3/4" },
          ].map((row, index) => (
            <div key={index} className="flex items-center gap-1">
              <span
                className={cn(
                  "flex size-2 shrink-0 items-center justify-center rounded-[2px] border text-[0.35rem] font-bold",
                  row.checked
                    ? "border-[#EC4899] bg-[#EC4899] text-white"
                    : "border-black/15 bg-white text-transparent",
                )}
              >
                ✓
              </span>
              <div className={cn("h-0.5 rounded-full bg-black/10", row.width)} />
            </div>
          ))}
        </div>
      </MiniCard>

      <MiniCard className="right-[6%] top-[10%] h-[48%] w-[38%]" rotate={4}>
        <div className="flex h-full flex-col items-center justify-center gap-1 p-1">
          <div className="flex size-4 items-center justify-center rounded-full bg-[#FCE7F3]">
            <svg viewBox="0 0 12 12" className="size-2.5 text-[#DB2777]" fill="currentColor">
              <path d="M6 1a4 4 0 0 1 4 4v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V5a4 4 0 0 1 4-4zm0 1.5A2.5 2.5 0 0 0 3.5 5v1h5V5A2.5 2.5 0 0 0 6 2.5z" />
            </svg>
          </div>
          <div className="h-0.5 w-3/4 rounded-full bg-black/10" />
          <div className="h-0.5 w-2/3 rounded-full bg-black/8" />
        </div>
      </MiniCard>
    </div>
  );
}

export function ClientSignoffIllustration({ className }: TemplateIllustrationProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[62%]", className)} aria-hidden>
      <MiniCard className="left-[6%] top-[18%] h-[50%] w-[42%]" rotate={-5}>
        <div className="p-1.5">
          <div className="h-0.5 w-2/3 rounded-full bg-black/10" />
          <div className="mt-1 h-0.5 w-full rounded-full bg-black/8" />
          <div className="mt-1 h-0.5 w-4/5 rounded-full bg-black/6" />
          <svg viewBox="0 0 60 16" className="mt-2 h-3 w-full text-[#4338CA]">
            <path
              d="M2 12 C 10 4, 18 14, 26 8 S 42 2, 58 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </MiniCard>

      <MiniCard className="right-[5%] top-[8%] h-[52%] w-[40%]" rotate={6}>
        <div className="flex h-full flex-col items-center justify-center p-1">
          <div className="flex size-7 rotate-[-12deg] items-center justify-center rounded-full border-2 border-[#22C55E] text-[0.4rem] font-extrabold uppercase tracking-wide text-[#22C55E]">
            Approved
          </div>
          <div className="mt-1.5 h-0.5 w-3/4 rounded-full bg-black/8" />
        </div>
      </MiniCard>
    </div>
  );
}

export const TEMPLATE_THUMBNAIL_ILLUSTRATIONS = {
  "idea-sprint": IdeaSprintIllustration,
  "mood-board": MoodBoardIllustration,
  "concept-map": ConceptMapIllustration,
  "asset-review": AssetReviewIllustration,
  "campaign-checklist": CampaignChecklistIllustration,
  "client-signoff": ClientSignoffIllustration,
} as const;
