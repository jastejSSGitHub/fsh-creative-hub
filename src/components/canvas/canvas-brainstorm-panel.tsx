"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type CanvasBrainstormPanelProps = {
  themeMode: "dark" | "light";
};

export function CanvasBrainstormPanel({ themeMode }: CanvasBrainstormPanelProps) {
  const [seconds, setSeconds] = useState(3 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const isLight = themeMode === "light";

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  const panelLabel = isLight ? "text-black/40" : "text-white/55";
  const timerDisplay = isLight
    ? "bg-black/[0.04] text-[#1a1a1a]"
    : "bg-white/[0.08] text-white";
  const secondaryBtn = isLight
    ? "border-black/10 text-[#1a1a1a]/80 hover:bg-black/[0.03] hover:text-[#1a1a1a]"
    : "border-white/15 bg-white/[0.06] text-white/90 hover:bg-white/[0.1] hover:text-white";
  const ctaBtn = isLight
    ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
    : "bg-[#a855f7] text-white shadow-md shadow-[#7c3aed]/35 hover:bg-[#c084fc]";

  return (
    <div className="space-y-4 p-3">
      <div>
        <p className={cn("mb-2 font-mono text-[0.58rem] uppercase tracking-[0.12em]", panelLabel)}>
          Timer
        </p>
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-center font-mono text-3xl tracking-widest",
            timerDisplay,
          )}
        >
          {mins}:{secs}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setSeconds((s) => s + 60)}
            className={cn(
              "flex-1 rounded-md border py-1.5 text-[0.75rem] font-medium transition-colors",
              secondaryBtn,
            )}
          >
            + 1 min
          </button>
          <button
            type="button"
            onClick={() => setTimerRunning((r) => !r)}
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
              ctaBtn,
            )}
            aria-label={timerRunning ? "Pause timer" : "Start timer"}
          >
            {timerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
