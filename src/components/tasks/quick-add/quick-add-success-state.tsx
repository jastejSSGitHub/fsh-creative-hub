"use client";

type QuickAddSuccessStateProps = {
  taskName: string;
};

export function QuickAddSuccessState({ taskName }: QuickAddSuccessStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95 duration-300"
      aria-live="polite"
    >
      <div className="hub-check-circle mb-4 flex size-[4.5rem] items-center justify-center rounded-full bg-hub-approved/12 ring-1 ring-hub-approved/25">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-9 text-hub-approved"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
            className="opacity-30"
          />
          <path
            d="M8 12.5l2.5 2.5L16 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hub-check-stroke"
          />
        </svg>
      </div>
      <p className="font-display text-lg font-semibold tracking-tight text-hub-foreground">
        Task added
      </p>
      <p className="mt-1 max-w-[22rem] truncate text-sm text-hub-foreground/60">{taskName}</p>
    </div>
  );
}
