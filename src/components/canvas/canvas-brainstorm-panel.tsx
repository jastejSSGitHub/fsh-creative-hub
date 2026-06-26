"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CanvasGlass } from "@/components/canvas/canvas-glass";
import { cn } from "@/lib/utils";

const MUSIC_OPTIONS = [
  { id: "ambient", label: "Acoustic ambient" },
  { id: "lofi", label: "Lo-fi focus" },
  { id: "soft", label: "Soft piano" },
] as const;

type CanvasBrainstormPanelProps = {
  themeMode: "dark" | "light";
};

export function CanvasBrainstormPanel({ themeMode }: CanvasBrainstormPanelProps) {
  const [seconds, setSeconds] = useState(3 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicTrack, setMusicTrack] = useState<(typeof MUSIC_OPTIONS)[number]["id"]>("ambient");
  const [volume, setVolume] = useState(0.6);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLight = themeMode === "light";

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (!musicPlaying) {
      audioRef.current?.pause();
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(
        "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bfac3.mp3?filename=lofi-study-112191.mp3",
      );
      audioRef.current.loop = true;
    }
    audioRef.current.volume = volume;
    void audioRef.current.play().catch(() => undefined);
  }, [musicPlaying, musicTrack, volume]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div className="space-y-4 p-3">
      <div>
        <p className={cn("mb-2 font-mono text-[0.58rem] uppercase tracking-[0.12em]", isLight ? "text-black/40" : "text-white/40")}>
          Timer
        </p>
        <div className={cn("rounded-lg px-4 py-3 text-center font-mono text-3xl tracking-widest", isLight ? "bg-black/[0.04]" : "bg-white/[0.06]")}>
          {mins}:{secs}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setSeconds((s) => s + 60)}
            className={cn(
              "flex-1 rounded-md border py-1.5 text-[0.75rem] font-medium",
              isLight ? "border-black/10 hover:bg-black/[0.03]" : "border-white/10 hover:bg-white/[0.06]",
            )}
          >
            + 1 min
          </button>
          <button
            type="button"
            onClick={() => setTimerRunning((r) => !r)}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#7c3aed] text-white"
            aria-label={timerRunning ? "Pause timer" : "Start timer"}
          >
            {timerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
      </div>

      <div className={cn("border-t pt-3", isLight ? "border-black/8" : "border-white/8")}>
        <p className={cn("mb-2 font-mono text-[0.58rem] uppercase tracking-[0.12em]", isLight ? "text-black/40" : "text-white/40")}>
          Music
        </p>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full border-4 border-black/80 bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-inner",
              musicPlaying && "animate-[spin_4s_linear_infinite]",
            )}
            aria-hidden
          >
            <div className="size-3 rounded-full bg-zinc-400" />
          </div>
          <select
            value={musicTrack}
            onChange={(e) => setMusicTrack(e.target.value as typeof musicTrack)}
            className={cn(
              "min-w-0 flex-1 rounded-md border px-2 py-1.5 text-[0.75rem] outline-none",
              isLight ? "border-black/10 bg-white" : "border-white/10 bg-white/5 text-white",
            )}
          >
            {MUSIC_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setMusicPlaying((p) => !p)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-white"
            aria-label={musicPlaying ? "Pause music" : "Play music"}
          >
            {musicPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
        <label className="mt-3 flex items-center gap-2">
          <Volume2 className={cn("size-3.5", isLight ? "text-black/45" : "text-white/45")} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1.5 flex-1 accent-[#7c3aed]"
          />
        </label>
      </div>
    </div>
  );
}
